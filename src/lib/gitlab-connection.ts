import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptSecret, decryptSecret } from '@/lib/token-crypto'
import { canonicalCallbackUrl as buildCallbackUrl, stateCookieDomain } from '@/lib/oauth-util'

// GitLab OAuth connection: customers connect their GitLab account once, and from
// then on we can clone any of their projects — public OR private — on their
// behalf, so they never have to paste a personal access token to deploy.
//
// Setup (one-time, by the Flowstas operator):
//   1. Create an application at gitlab.com → User Settings → Applications.
//      Redirect URI: https://<your-site>/api/gitlab/callback
//      Scopes: read_repository, read_api. (Leave "Confidential" checked.)
//   2. Set env: GITLAB_OAUTH_CLIENT_ID, GITLAB_OAUTH_CLIENT_SECRET
//      (APP_TOKEN_ENC_KEY is already used to encrypt clone tokens.)
//
// We request `read_repository read_api`, enough to read private repos + list the
// user's projects for the deploy picker.

export const GITLAB_OAUTH_SCOPE = 'read_repository read_api'

// Re-export the shared CSRF cookie helper so the GitLab routes can import it from
// here, mirroring the GitHub module.
export { stateCookieDomain }

// The OAuth callback URL must EXACTLY match the one registered on the GitLab app
// (see lib/oauth-util for the apex/www canonicalization rationale). A single
// registered callback — https://flowstas.com/api/gitlab/callback — works no
// matter which host the user is on.
export function canonicalCallbackUrl(origin: string): string {
  return buildCallbackUrl(origin, '/api/gitlab/callback')
}

export function gitlabOAuthConfigured(): boolean {
  return Boolean(process.env.GITLAB_OAUTH_CLIENT_ID && process.env.GITLAB_OAUTH_CLIENT_SECRET)
}

// Build the URL we send the user to in order to authorize Flowstas. `state` is a
// CSRF token the caller also stores in a cookie and verifies on callback.
export function authorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITLAB_OAUTH_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GITLAB_OAUTH_SCOPE,
    state,
  })
  return `https://gitlab.com/oauth/authorize?${params.toString()}`
}

// Exchange the ?code from the callback for an access token, then look up which
// GitLab account it belongs to. Throws on any failure with a readable message.
export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<{ token: string; login: string; scope: string }> {
  const res = await fetch('https://gitlab.com/oauth/token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITLAB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITLAB_OAUTH_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string
    scope?: string
    error_description?: string
    error?: string
  }
  if (!data.access_token) {
    throw new Error(data.error_description || data.error || 'GitLab did not return an access token.')
  }
  const login = await fetchLogin(data.access_token)
  return { token: data.access_token, login, scope: data.scope || GITLAB_OAUTH_SCOPE }
}

async function fetchLogin(token: string): Promise<string> {
  const res = await fetch('https://gitlab.com/api/v4/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'flowstas',
    },
  })
  if (!res.ok) throw new Error('Could not read your GitLab account.')
  const u = (await res.json()) as { username?: string }
  return u.username || 'unknown'
}

// Persist (or replace) a user's connection.
export async function saveConnection(
  userId: string,
  token: string,
  login: string,
  scope: string
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('gitlab_connections').upsert({
    user_id: userId,
    login,
    token_enc: encryptSecret(token),
    scope,
    updated_at: new Date().toISOString(),
  })
}

// Public-facing connection status (never returns the token).
export async function getConnection(
  userId: string
): Promise<{ login: string; scope: string | null } | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('gitlab_connections')
    .select('login, scope')
    .eq('user_id', userId)
    .maybeSingle()
  if (!data) return null
  return { login: data.login as string, scope: (data.scope as string) ?? null }
}

// Decrypt and return a user's connection token, or null if not connected/invalid.
export async function getConnectionToken(userId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('gitlab_connections')
    .select('token_enc')
    .eq('user_id', userId)
    .maybeSingle()
  const enc = data?.token_enc as string | undefined
  if (!enc) return null
  try {
    return decryptSecret(enc)
  } catch {
    return null
  }
}

export async function deleteConnection(userId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('gitlab_connections').delete().eq('user_id', userId)
}

// List the user's projects (most recently active first) for the deploy picker.
export async function listRepos(
  token: string
): Promise<{ fullName: string; url: string; private: boolean; defaultBranch: string }[]> {
  const res = await fetch(
    'https://gitlab.com/api/v4/projects?membership=true&simple=true&per_page=100&order_by=last_activity_at',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': 'flowstas',
      },
    }
  )
  if (!res.ok) throw new Error('Could not list your repositories.')
  const repos = (await res.json()) as {
    path_with_namespace: string
    http_url_to_repo: string
    visibility: string
    default_branch: string
  }[]
  return repos.map((r) => ({
    fullName: r.path_with_namespace,
    url: r.http_url_to_repo,
    private: r.visibility !== 'public',
    defaultBranch: r.default_branch,
  }))
}

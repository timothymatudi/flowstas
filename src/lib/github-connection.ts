import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptSecret, decryptSecret } from '@/lib/token-crypto'

// GitHub OAuth connection: customers connect their GitHub account once, and from
// then on we can clone any of their repos — public OR private — on their behalf,
// so they never have to paste a personal access token to deploy.
//
// Setup (one-time, by the Flowstas operator):
//   1. Create an OAuth App at github.com → Settings → Developer settings →
//      OAuth Apps. Authorization callback URL: https://<your-site>/api/github/callback
//   2. Set env: GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET
//      (APP_TOKEN_ENC_KEY is already used to encrypt clone tokens.)
//
// We request the `repo` scope, which is what GitHub's classic OAuth grants for
// reading private repositories.

export const GITHUB_OAUTH_SCOPE = 'repo'

export function githubOAuthConfigured(): boolean {
  return Boolean(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET)
}

// Build the URL we send the user to in order to authorize Flowstas. `state` is a
// CSRF token the caller also stores in a cookie and verifies on callback.
export function authorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_OAUTH_CLIENT_ID || '',
    redirect_uri: redirectUri,
    scope: GITHUB_OAUTH_SCOPE,
    state,
    allow_signup: 'true',
  })
  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

// Exchange the ?code from the callback for an access token, then look up which
// GitHub account it belongs to. Throws on any failure with a readable message.
export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<{ token: string; login: string; scope: string }> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
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
    throw new Error(data.error_description || data.error || 'GitHub did not return an access token.')
  }
  const login = await fetchLogin(data.access_token)
  return { token: data.access_token, login, scope: data.scope || GITHUB_OAUTH_SCOPE }
}

async function fetchLogin(token: string): Promise<string> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'flowstas',
    },
  })
  if (!res.ok) throw new Error('Could not read your GitHub account.')
  const u = (await res.json()) as { login?: string }
  return u.login || 'unknown'
}

// Persist (or replace) a user's connection.
export async function saveConnection(
  userId: string,
  token: string,
  login: string,
  scope: string
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('github_connections').upsert({
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
    .from('github_connections')
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
    .from('github_connections')
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

// Decide which token to clone a repo with. Priority:
//   1. a token the caller passed explicitly (manual PAT, or a non-GitHub host)
//   2. the user's connected GitHub account — for github.com repos only, since the
//      OAuth token is GitHub-specific
//   3. none (public repo, no auth needed)
// This is what makes "connect once, deploy any repo" work without pasting tokens.
export async function resolveCloneToken(
  userId: string,
  repo: string,
  manualToken?: string | null
): Promise<string | null> {
  if (manualToken && manualToken.trim()) return manualToken.trim()
  if (/^https:\/\/(?:www\.)?github\.com\//i.test(repo)) {
    return await getConnectionToken(userId)
  }
  return null
}

export async function deleteConnection(userId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('github_connections').delete().eq('user_id', userId)
}

// List the user's repositories (most recently pushed first) for the deploy picker.
export async function listRepos(
  token: string
): Promise<{ fullName: string; url: string; private: boolean; defaultBranch: string }[]> {
  const res = await fetch(
    'https://api.github.com/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'flowstas',
      },
    }
  )
  if (!res.ok) throw new Error('Could not list your repositories.')
  const repos = (await res.json()) as {
    full_name: string
    html_url: string
    private: boolean
    default_branch: string
  }[]
  return repos.map((r) => ({
    fullName: r.full_name,
    url: r.html_url,
    private: r.private,
    defaultBranch: r.default_branch,
  }))
}

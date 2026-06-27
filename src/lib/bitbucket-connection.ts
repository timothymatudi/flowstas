import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptSecret, decryptSecret } from '@/lib/token-crypto'
import { canonicalCallbackUrl as buildCallbackUrl, stateCookieDomain } from '@/lib/oauth-util'

// Bitbucket OAuth connection: customers connect their Bitbucket account once, and
// from then on we can clone any of their repos — public OR private — on their
// behalf, so they never have to paste an app password to deploy.
//
// Setup (one-time, by the Flowstas operator):
//   1. Create an OAuth consumer at bitbucket.org → Workspace settings →
//      OAuth consumers. Callback URL: https://<your-site>/api/bitbucket/callback
//      Permissions: Repositories → Read.
//   2. Set env: BITBUCKET_OAUTH_CLIENT_ID, BITBUCKET_OAUTH_CLIENT_SECRET
//      (APP_TOKEN_ENC_KEY is already used to encrypt clone tokens.)
//
// We request the `repository` scope, enough to read private repos + list the
// user's repositories for the deploy picker.

export const BITBUCKET_OAUTH_SCOPE = 'repository'

// Re-export the shared CSRF cookie helper so the Bitbucket routes can import it
// from here, mirroring the GitHub module.
export { stateCookieDomain }

// The OAuth callback URL must EXACTLY match the one registered on the Bitbucket
// consumer (see lib/oauth-util for the apex/www canonicalization rationale). A
// single registered callback — https://flowstas.com/api/bitbucket/callback —
// works no matter which host the user is on.
export function canonicalCallbackUrl(origin: string): string {
  return buildCallbackUrl(origin, '/api/bitbucket/callback')
}

export function bitbucketOAuthConfigured(): boolean {
  return Boolean(
    process.env.BITBUCKET_OAUTH_CLIENT_ID && process.env.BITBUCKET_OAUTH_CLIENT_SECRET
  )
}

// Build the URL we send the user to in order to authorize Flowstas. `state` is a
// CSRF token the caller also stores in a cookie and verifies on callback.
export function authorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.BITBUCKET_OAUTH_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: BITBUCKET_OAUTH_SCOPE,
    state,
  })
  return `https://bitbucket.org/site/oauth2/authorize?${params.toString()}`
}

// Exchange the ?code from the callback for an access token, then look up which
// Bitbucket account it belongs to. Throws on any failure with a readable message.
// Bitbucket wants the token request form-urlencoded, with the client credentials
// supplied via HTTP Basic auth.
export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<{ token: string; login: string; scope: string }> {
  const basic = Buffer.from(
    `${process.env.BITBUCKET_OAUTH_CLIENT_ID}:${process.env.BITBUCKET_OAUTH_CLIENT_SECRET}`
  ).toString('base64')
  const res = await fetch('https://bitbucket.org/site/oauth2/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  })
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string
    scopes?: string
    error_description?: string
    error?: string
  }
  if (!data.access_token) {
    throw new Error(
      data.error_description || data.error || 'Bitbucket did not return an access token.'
    )
  }
  const login = await fetchLogin(data.access_token)
  return { token: data.access_token, login, scope: data.scopes || BITBUCKET_OAUTH_SCOPE }
}

async function fetchLogin(token: string): Promise<string> {
  const res = await fetch('https://api.bitbucket.org/2.0/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'flowstas',
    },
  })
  if (!res.ok) throw new Error('Could not read your Bitbucket account.')
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
  await supabase.from('bitbucket_connections').upsert({
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
    .from('bitbucket_connections')
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
    .from('bitbucket_connections')
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
  await supabase.from('bitbucket_connections').delete().eq('user_id', userId)
}

// List the user's repositories (most recently updated first) for the deploy
// picker. Bitbucket returns the clone URLs under links.clone (https + ssh); we
// pick the https one.
export async function listRepos(
  token: string
): Promise<{ fullName: string; url: string; private: boolean; defaultBranch: string }[]> {
  const res = await fetch(
    'https://api.bitbucket.org/2.0/repositories?role=member&pagelen=100&sort=-updated_on',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': 'flowstas',
      },
    }
  )
  if (!res.ok) throw new Error('Could not list your repositories.')
  const body = (await res.json()) as {
    values?: {
      full_name: string
      is_private: boolean
      mainbranch?: { name?: string }
      links?: { clone?: { name: string; href: string }[] }
    }[]
  }
  return (body.values ?? []).map((r) => ({
    fullName: r.full_name,
    url: r.links?.clone?.find((c) => c.name === 'https')?.href ?? '',
    private: r.is_private,
    defaultBranch: r.mainbranch?.name ?? '',
  }))
}

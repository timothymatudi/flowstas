import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import {
  authorizeUrl,
  bitbucketOAuthConfigured,
  canonicalCallbackUrl,
  stateCookieDomain,
} from '@/lib/bitbucket-connection'

export const dynamic = 'force-dynamic'

// GET /api/bitbucket/connect — kick off the Bitbucket OAuth flow. Sets a
// short-lived CSRF state cookie and redirects the user to Bitbucket's authorize
// page. After they approve, Bitbucket redirects back to /api/bitbucket/callback.
export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const origin = new URL(req.url).origin
  if (!user) return NextResponse.redirect(new URL('/auth/login', origin))

  if (!bitbucketOAuthConfigured())
    return NextResponse.redirect(new URL('/deploy?bitbucket=unavailable', origin))

  // Where to send the user after the round-trip (defaults to the deploy page).
  const returnTo = new URL(req.url).searchParams.get('returnTo') || '/deploy'

  const state = crypto.randomBytes(16).toString('hex')
  const redirectUri = canonicalCallbackUrl(origin)
  const res = NextResponse.redirect(authorizeUrl(redirectUri, state))
  // httpOnly cookie holds the CSRF state + return target; verified on callback.
  // Domain is shared across apex + www so the callback can read it after the
  // apex→www redirect.
  res.cookies.set('bb_oauth_state', `${state}:${returnTo}`, {
    httpOnly: true,
    secure: origin.startsWith('https'),
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
    domain: stateCookieDomain(new URL(req.url).host),
  })
  return res
}

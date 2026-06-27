import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { authorizeUrl, githubOAuthConfigured } from '@/lib/github-connection'

export const dynamic = 'force-dynamic'

// GET /api/github/connect — kick off the GitHub OAuth flow. Sets a short-lived
// CSRF state cookie and redirects the user to GitHub's authorize page. After they
// approve, GitHub redirects back to /api/github/callback.
export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const origin = new URL(req.url).origin
  if (!user) return NextResponse.redirect(new URL('/auth/login', origin))

  if (!githubOAuthConfigured())
    return NextResponse.redirect(new URL('/deploy?github=unavailable', origin))

  // Where to send the user after the round-trip (defaults to the deploy page).
  const returnTo = new URL(req.url).searchParams.get('returnTo') || '/deploy'

  const state = crypto.randomBytes(16).toString('hex')
  const redirectUri = `${origin}/api/github/callback`
  const res = NextResponse.redirect(authorizeUrl(redirectUri, state))
  // httpOnly cookie holds the CSRF state + return target; verified on callback.
  res.cookies.set('gh_oauth_state', `${state}:${returnTo}`, {
    httpOnly: true,
    secure: origin.startsWith('https'),
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}

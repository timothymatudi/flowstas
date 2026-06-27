import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCode, saveConnection } from '@/lib/github-connection'

export const dynamic = 'force-dynamic'

// GET /api/github/callback — GitHub redirects here after the user authorizes.
// We verify the CSRF state, swap the code for a token, store it (encrypted), and
// send the user back where they started with ?github=connected.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const origin = url.origin
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', origin))

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/(?:^|;\s*)gh_oauth_state=([^;]+)/)
  const [savedState, returnTo = '/deploy'] = match
    ? decodeURIComponent(match[1]).split(':')
    : []

  const fail = (reason: string) => {
    const dest = new URL(returnTo || '/deploy', origin)
    dest.searchParams.set('github', reason)
    const r = NextResponse.redirect(dest)
    r.cookies.set('gh_oauth_state', '', { path: '/', maxAge: 0 })
    return r
  }

  if (url.searchParams.get('error')) return fail('denied')
  if (!code || !state || !savedState || state !== savedState) return fail('invalid')

  try {
    const { token, login, scope } = await exchangeCode(code, `${origin}/api/github/callback`)
    await saveConnection(user.id, token, login, scope)
  } catch {
    return fail('failed')
  }

  const dest = new URL(returnTo || '/deploy', origin)
  dest.searchParams.set('github', 'connected')
  const res = NextResponse.redirect(dest)
  res.cookies.set('gh_oauth_state', '', { path: '/', maxAge: 0 })
  return res
}

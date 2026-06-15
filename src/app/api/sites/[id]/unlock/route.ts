import { getSitePasswordHash, checkSitePassword, unlockCookieName, unlockToken } from '@/lib/site-store'

export const dynamic = 'force-dynamic'

// Verify a protected site's password and, on success, set a host-scoped unlock
// cookie, then send the visitor back to the page they came from.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const form = await req.formData()
  const password = String(form.get('password') ?? '')
  const hash = await getSitePasswordHash(id)

  const referer = req.headers.get('referer')
  const back = referer ? new URL(referer) : new URL(req.url)
  back.search = ''

  if (!hash || !checkSitePassword(id, hash, password)) {
    back.searchParams.set('pw', 'bad')
    return Response.redirect(back.toString(), 303)
  }

  const res = new Response(null, { status: 303, headers: { Location: back.toString() } })
  res.headers.append(
    'Set-Cookie',
    `${unlockCookieName(id)}=${unlockToken(hash)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
  )
  return res
}

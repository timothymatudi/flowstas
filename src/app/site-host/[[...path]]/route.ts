import { getSiteIdBySubdomain, getSiteIdByCustomDomain } from '@/lib/site-store'
import { serveSite } from '@/lib/serve-site'

export const dynamic = 'force-dynamic'

const SUFFIX = '.flowstas.com'

// Serves a published site by its Host. The middleware (proxy.ts) rewrites both
// "<slug>.flowstas.com/<path>" and connected custom domains to "/site-host/<path>"
// while preserving the Host header, so we resolve the Host to a site id here.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase()
  let id: string | null = null
  if (host.endsWith(SUFFIX)) {
    id = await getSiteIdBySubdomain(host.slice(0, -SUFFIX.length))
  } else if (host) {
    id = await getSiteIdByCustomDomain(host)
  }
  if (!id) return new Response('Site not found', { status: 404 })

  const { path: segments } = await params
  const reqPath = (segments ?? []).join('/')
  return serveSite(id, reqPath, req)
}

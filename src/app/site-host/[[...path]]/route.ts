import { getSiteIdBySubdomain } from '@/lib/site-store'
import { serveSite } from '@/lib/serve-site'

export const dynamic = 'force-dynamic'

const SUFFIX = '.flowstas.com'

// Serves a published site by its subdomain. The middleware (proxy.ts) rewrites
// "<slug>.flowstas.com/<path>" to "/site-host/<path>" while preserving the Host
// header, so we read the slug from Host and resolve it to a site id.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const slug = host.endsWith(SUFFIX) ? host.slice(0, -SUFFIX.length) : ''
  const id = slug ? await getSiteIdBySubdomain(slug) : null
  if (!id) return new Response('Site not found', { status: 404 })

  const { path: segments } = await params
  const reqPath = (segments ?? []).join('/')
  return serveSite(id, reqPath, req.url)
}

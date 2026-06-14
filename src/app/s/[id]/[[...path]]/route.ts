import { serveSite } from '@/lib/serve-site'

export const dynamic = 'force-dynamic'

// Serve a published site (any file in it) live at /s/<id>/<path...>.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; path?: string[] }> }
) {
  const { id, path: segments } = await params
  const reqPath = (segments ?? []).join('/')
  return serveSite(id, reqPath, req.url)
}

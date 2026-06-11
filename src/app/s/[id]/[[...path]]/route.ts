import { getSiteFile, renderSite } from '@/lib/site-store'

export const dynamic = 'force-dynamic'

// Serve a published site (any file in it) live at /s/<id>/<path...>.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; path?: string[] }> }
) {
  const { id, path: segments } = await params
  const reqPath = (segments ?? []).join('/')
  const file = await getSiteFile(id, reqPath)
  if (!file) {
    return new Response('Site not found', { status: 404 })
  }

  // HTML pages get the contact-form wiring + optional "sent" banner.
  if (file.isHtml) {
    const sent = new URL(req.url).searchParams.get('sent') === '1'
    const html = renderSite(new TextDecoder().decode(file.bytes), { id, sent })
    return new Response(html, { headers: { 'Content-Type': file.contentType } })
  }

  return new Response(Buffer.from(file.bytes), {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

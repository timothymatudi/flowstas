import { getSiteHtml, renderSite } from '@/lib/site-store'

export const dynamic = 'force-dynamic'

// Serve a published site live at /s/<id>.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const html = await getSiteHtml(id)
  if (html === null) {
    return new Response('Site not found', { status: 404 })
  }
  const sent = new URL(req.url).searchParams.get('sent') === '1'
  return new Response(renderSite(html, { id, sent }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

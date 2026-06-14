import { getSiteFile, renderSite } from '@/lib/site-store'

// Serve one file from a published site as an HTTP Response. Shared by both the
// id route (/s/<id>/...) and the subdomain host route (<slug>.flowstas.com/...).
export async function serveSite(id: string, reqPath: string, reqUrl: string): Promise<Response> {
  const file = await getSiteFile(id, reqPath)
  if (!file) return new Response('Site not found', { status: 404 })

  // HTML pages get the contact-form wiring + optional "sent" banner.
  if (file.isHtml) {
    const sent = new URL(reqUrl).searchParams.get('sent') === '1'
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

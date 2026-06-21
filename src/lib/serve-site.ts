import {
  getSiteFile,
  renderSite,
  getSitePasswordHash,
  unlockCookieName,
  unlockToken,
  recordView,
} from '@/lib/site-store'

// A simple, clean password gate shown for protected sites.
function passwordGateHtml(id: string, status: 'bad' | 'rate' | null): string {
  const error =
    status === 'rate'
      ? 'Too many attempts — please wait a moment and try again.'
      : status === 'bad'
        ? 'Incorrect password — try again.'
        : ''
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Protected site</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#f5f5f4;display:flex;min-height:100vh;align-items:center;justify-content:center}
.c{background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:32px;max-width:360px;width:90%;box-shadow:0 12px 40px -16px rgba(0,0,0,.2);text-align:center}
h1{font-size:20px;margin:0 0 6px;color:#1c1917}p{color:#78716c;font-size:14px;margin:0 0 20px}
input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #d6d3d1;border-radius:10px;font-size:15px;margin-bottom:12px}
button{width:100%;padding:12px;border:0;border-radius:10px;background:#1c1917;color:#fff;font-weight:600;font-size:15px;cursor:pointer}
.e{color:#dc2626;font-size:13px;margin-bottom:12px}</style></head>
<body><form class="c" method="POST" action="/api/sites/${id}/unlock">
<h1>🔒 This site is private</h1><p>Enter the password to continue.</p>
${error ? `<div class="e">${error}</div>` : ''}
<input type="password" name="password" placeholder="Password" autofocus required>
<button type="submit">Enter site</button></form></body></html>`
}

// Serve one file from a published site as an HTTP Response. Shared by the id
// route (/s/<id>/...) and the host route (<slug>.flowstas.com or a custom domain).
// Handles the password gate, custom 404, and view counting.
export async function serveSite(id: string, reqPath: string, req: Request): Promise<Response> {
  // Password gate.
  const pwHash = await getSitePasswordHash(id)
  if (pwHash) {
    const want = `${unlockCookieName(id)}=${unlockToken(pwHash)}`
    const cookies = (req.headers.get('cookie') || '').split(';').map((c) => c.trim())
    if (!cookies.includes(want)) {
      const pw = new URL(req.url).searchParams.get('pw')
      const status = pw === 'bad' || pw === 'rate' ? pw : null
      return new Response(passwordGateHtml(id, status), {
        status: 401,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
  }

  const file = await getSiteFile(id, reqPath)
  if (!file) {
    // Custom 404: serve the site's own 404.html if it has one.
    const custom = await getSiteFile(id, '404.html')
    if (custom) {
      const html = renderSite(new TextDecoder().decode(custom.bytes), { id })
      return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }
    return new Response('Site not found', { status: 404 })
  }

  if (file.isHtml) {
    await recordView(id)
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

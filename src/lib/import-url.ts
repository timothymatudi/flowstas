import 'server-only'
import type { SiteFile } from '@/lib/site-store'

// Pull a live page into a publishable site. We fetch the HTML server-side (no
// CORS limits) and inject a <base href> so the page's relative assets — CSS,
// images, scripts — keep loading from the original site. This is a snapshot of
// the page, not a full recursive crawl.

export type ImportResult =
  | { ok: true; name: string; files: SiteFile[] }
  | { ok: false; status: number; error: string }

const FETCH_TIMEOUT_MS = 10_000
const MAX_HTML_BYTES = 5 * 1024 * 1024

// Block obviously-internal targets so this can't be used to probe our own
// network (basic SSRF guard). Public DNS names still resolve normally.
function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal')) return true
  if (/^127\./.test(h) || h === '0.0.0.0' || h === '::1') return true
  if (/^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true
  return false
}

function nameFromUrl(u: URL): string {
  return u.hostname.replace(/^www\./, '')
}

// Insert <base href="..."> as the first thing in <head> so relative URLs in the
// page resolve against the original location.
function injectBase(html: string, pageUrl: string): string {
  const baseTag = `<base href="${pageUrl}">`
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}\n${baseTag}`)
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html[^>]*>/i, (m) => `${m}\n<head>${baseTag}</head>`)
  }
  return `${baseTag}\n${html}`
}

export async function importFromUrl(rawUrl: string): Promise<ImportResult> {
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    return { ok: false, status: 400, error: 'That doesn’t look like a valid web address.' }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, status: 400, error: 'Only http:// and https:// addresses can be imported.' }
  }
  if (isBlockedHost(url.hostname)) {
    return { ok: false, status: 400, error: 'That address can’t be imported.' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'FlowstasImporter/1.0', Accept: 'text/html,*/*' },
    })
  } catch {
    return { ok: false, status: 502, error: 'Could not reach that website to import it.' }
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    return { ok: false, status: 502, error: `That website returned an error (${res.status}).` }
  }
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) {
    return { ok: false, status: 415, error: 'That address isn’t an HTML page we can import.' }
  }

  const raw = await res.arrayBuffer()
  if (raw.byteLength > MAX_HTML_BYTES) {
    return { ok: false, status: 413, error: 'That page is too large to import.' }
  }
  const html = injectBase(new TextDecoder().decode(raw), res.url || url.toString())

  return {
    ok: true,
    name: nameFromUrl(url),
    files: [{ path: 'index.html', bytes: new TextEncoder().encode(html) }],
  }
}

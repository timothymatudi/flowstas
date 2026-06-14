import { unzipSync } from 'fflate'
import type { SiteFile } from '@/lib/site-store'

// Max accepted upload size (bytes) — keeps a single publish reasonable.
const MAX_TOTAL = 25 * 1024 * 1024

export type ParsedUpload =
  | { ok: true; name: string; files: SiteFile[] }
  | { ok: false; status: number; error: string }

// Turn a publish/update request into a set of site files. Accepts either:
//  - JSON  { name, html }                  → single pasted HTML page
//  - multipart with a `zip` file            → unzipped into a site
//  - multipart with one+ `files`            → a folder upload (webkitRelativePath)
export async function parseUpload(req: Request): Promise<ParsedUpload> {
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => null)
    if (!body || typeof body.html !== 'string' || !body.html.trim()) {
      return { ok: false, status: 400, error: 'Add some HTML for your site first.' }
    }
    return {
      ok: true,
      name: String(body.name ?? ''),
      files: [{ path: 'index.html', bytes: new TextEncoder().encode(body.html) }],
    }
  }

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    const name = String(form.get('name') ?? '')
    const files: SiteFile[] = []
    let total = 0

    const zip = form.get('zip')
    if (zip instanceof File && zip.size > 0) {
      total = zip.size
      if (total > MAX_TOTAL) return { ok: false, status: 413, error: 'That zip is too large (max 25 MB).' }
      const entries = unzipSync(new Uint8Array(await zip.arrayBuffer()))
      for (const [p, bytes] of Object.entries(entries)) {
        if (p.endsWith('/')) continue
        files.push({ path: p, bytes })
      }
    } else {
      for (const value of form.getAll('files')) {
        if (!(value instanceof File) || value.size === 0) continue
        total += value.size
        if (total > MAX_TOTAL) return { ok: false, status: 413, error: 'Those files are too large (max 25 MB).' }
        // Browsers send the folder-relative path as the file name when using
        // <input webkitdirectory>; fall back to the bare name.
        const rel = (value as File & { webkitRelativePath?: string }).webkitRelativePath || value.name
        files.push({ path: rel, bytes: new Uint8Array(await value.arrayBuffer()) })
      }
    }

    if (files.length === 0) {
      return { ok: false, status: 400, error: 'No files received. Pick a folder or a .zip of your site.' }
    }
    return { ok: true, name, files }
  }

  return { ok: false, status: 415, error: 'Unsupported upload type.' }
}

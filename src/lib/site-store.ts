import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

// Local-disk store for published sites + their form submissions.
// This is the demo backend; in production these move to Supabase Storage + a
// database table (the rest of the flow stays identical).

export interface SiteMeta {
  id: string
  name: string
  createdAt: string
}

export interface Submission {
  id: string
  name: string
  email: string
  message: string
  createdAt: string
}

const ROOT = path.join(process.cwd(), '.data', 'sites')

function siteDir(id: string) {
  return path.join(ROOT, id)
}

function newId() {
  return crypto.randomBytes(4).toString('hex') // 8 hex chars, URL-friendly
}

export async function createSite(name: string, html: string): Promise<SiteMeta> {
  const id = newId()
  await fs.mkdir(siteDir(id), { recursive: true })
  const meta: SiteMeta = {
    id,
    name: name.trim() || 'Untitled site',
    createdAt: new Date().toISOString(),
  }
  await fs.writeFile(path.join(siteDir(id), 'meta.json'), JSON.stringify(meta, null, 2))
  await fs.writeFile(path.join(siteDir(id), 'index.html'), html, 'utf8')
  await fs.writeFile(path.join(siteDir(id), 'submissions.json'), '[]')
  return meta
}

export async function getSiteHtml(id: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(siteDir(id), 'index.html'), 'utf8')
  } catch {
    return null
  }
}

export async function getSiteMeta(id: string): Promise<SiteMeta | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(siteDir(id), 'meta.json'), 'utf8'))
  } catch {
    return null
  }
}

export async function listSites(): Promise<SiteMeta[]> {
  const ids = await fs.readdir(ROOT).catch(() => [] as string[])
  const metas = await Promise.all(ids.map((id) => getSiteMeta(id)))
  return metas
    .filter((m): m is SiteMeta => m !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function listSubmissions(id: string): Promise<Submission[]> {
  try {
    return JSON.parse(await fs.readFile(path.join(siteDir(id), 'submissions.json'), 'utf8'))
  } catch {
    return []
  }
}

export async function addSubmission(
  id: string,
  data: { name: string; email: string; message: string }
): Promise<Submission | null> {
  if (!(await getSiteMeta(id))) return null
  const list = await listSubmissions(id)
  const submission: Submission = {
    id: newId(),
    name: data.name,
    email: data.email,
    message: data.message,
    createdAt: new Date().toISOString(),
  }
  list.unshift(submission)
  await fs.writeFile(path.join(siteDir(id), 'submissions.json'), JSON.stringify(list, null, 2))
  return submission
}

// Prepare stored HTML for serving: point the contact form at the real capture
// endpoint, and (optionally) show a "message sent" banner after a submission.
export function renderSite(html: string, opts: { id: string; sent?: boolean }): string {
  let out = html.split('{{FORM_ACTION}}').join(`/api/sites/${opts.id}/submit`)
  if (opts.sent) {
    const banner =
      '<div style="position:fixed;top:0;left:0;right:0;background:#16a34a;color:#fff;' +
      'padding:12px;text-align:center;font-family:sans-serif;z-index:99999">' +
      '✓ Message sent — the site owner has been notified.</div>'
    out = /<body[^>]*>/i.test(out) ? out.replace(/(<body[^>]*>)/i, `$1${banner}`) : banner + out
  }
  return out
}

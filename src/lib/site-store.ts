import 'server-only'
import path from 'node:path'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Store for published sites + their form submissions, backed by Supabase:
//   - site files     → Storage bucket "sites", keyed "<id>/<relpath>"
//   - site metadata   → public.sites table
//   - form messages   → public.site_submissions table
// Run scripts/sites-tables.sql once to provision the tables + bucket.

export interface SiteMeta {
  id: string
  name: string
  createdAt: string
  // number of files in the site (1 for a single pasted HTML page)
  fileCount: number
}

export interface Submission {
  id: string
  name: string
  email: string
  message: string
  createdAt: string
}

// A file making up a site: a relative path (e.g. "index.html", "css/app.css")
// and its bytes.
export interface SiteFile {
  path: string
  bytes: Uint8Array
}

const BUCKET = 'sites'

function newId() {
  return crypto.randomBytes(4).toString('hex') // 8 hex chars, URL-friendly
}

// Normalise an uploaded relative path: strip leading slashes, collapse "..",
// and drop anything that would escape the site root. Returns null if unsafe.
function safeRelPath(rel: string): string | null {
  const normalized = path
    .normalize(rel.replace(/\\/g, '/'))
    .replace(/^(\.\.(\/|$))+/, '')
    .replace(/^\/+/, '')
  if (!normalized || normalized === '.' || normalized.split('/').includes('..')) return null
  return normalized
}

// If every file shares one top-level folder (the usual result of zipping a
// folder), strip it so "myfolder/index.html" serves at "/".
function stripCommonRoot(files: SiteFile[]): SiteFile[] {
  if (files.length === 0) return files
  const first = files[0].path.split('/')[0]
  if (!first) return files
  const allShare = files.every((f) => f.path === first || f.path.startsWith(first + '/'))
  if (!allShare || files.some((f) => f.path === first)) return files
  return files.map((f) => ({ ...f, path: f.path.slice(first.length + 1) }))
}

// Choose the entry page so "/s/<id>" lands somewhere sensible.
function pickEntry(paths: string[]): string | null {
  const lower = paths.map((p) => p.toLowerCase())
  const idx = lower.indexOf('index.html')
  if (idx !== -1) return paths[idx]
  const anyHtml = paths.findIndex((p) => p.toLowerCase().endsWith('.html'))
  return anyHtml !== -1 ? paths[anyHtml] : null
}

export async function createSite(
  name: string,
  files: SiteFile[],
  ownerId?: string
): Promise<SiteMeta> {
  // Clean + de-dupe paths, drop directory entries and macOS cruft.
  const cleaned: SiteFile[] = []
  const seen = new Set<string>()
  for (const f of files) {
    if (f.path.endsWith('/') || f.path.startsWith('__MACOSX/') || f.path.includes('/.')) continue
    const rel = safeRelPath(f.path)
    if (!rel || seen.has(rel)) continue
    seen.add(rel)
    cleaned.push({ path: rel, bytes: f.bytes })
  }
  const rooted = stripCommonRoot(cleaned)

  const entry = pickEntry(rooted.map((f) => f.path))
  if (!entry) throw new Error('Your site needs at least one .html file (e.g. index.html).')

  // Ensure the entry page is reachable at "/" by also writing it as index.html.
  if (entry.toLowerCase() !== 'index.html' && !rooted.some((f) => f.path === 'index.html')) {
    const e = rooted.find((f) => f.path === entry)!
    rooted.push({ path: 'index.html', bytes: e.bytes })
  }

  const id = newId()
  const supabase = createAdminClient()

  // Upload every file into the bucket under this site's id.
  for (const f of rooted) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${id}/${f.path}`, Buffer.from(f.bytes), {
        contentType: contentTypeFor(f.path),
        upsert: true,
      })
    if (error) throw new Error(`Could not store ${f.path}: ${error.message}`)
  }

  const meta: SiteMeta = {
    id,
    name: name.trim() || 'Untitled site',
    createdAt: new Date().toISOString(),
    fileCount: rooted.length,
  }
  const { error: dbError } = await supabase.from('sites').insert({
    id: meta.id,
    name: meta.name,
    file_count: meta.fileCount,
    created_at: meta.createdAt,
    owner_id: ownerId ?? null,
  })
  if (dbError) {
    // Roll back the uploaded files so we don't leave orphans behind.
    await supabase.storage.from(BUCKET).remove(rooted.map((f) => `${id}/${f.path}`))
    throw new Error(`Could not save your site: ${dbError.message}`)
  }
  return meta
}

// Convenience for the paste-HTML flow.
export async function createSiteFromHtml(
  name: string,
  html: string,
  ownerId?: string
): Promise<SiteMeta> {
  return createSite(name, [{ path: 'index.html', bytes: new TextEncoder().encode(html) }], ownerId)
}

// Recursively collect every object key stored under "<prefix>/". Supabase's
// list() only returns one level, so we walk into sub-folders (which come back
// as entries with a null id) to gather nested files too.
async function listAllKeys(
  supabase: ReturnType<typeof createAdminClient>,
  prefix: string
): Promise<string[]> {
  const keys: string[] = []
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 })
  if (error || !data) return keys
  for (const entry of data) {
    const full = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.id === null) {
      keys.push(...(await listAllKeys(supabase, full)))
    } else {
      keys.push(full)
    }
  }
  return keys
}

// Permanently delete a site the given user owns: its stored files, its captured
// form messages, and its metadata row. Returns false if the site doesn't exist
// or isn't owned by this user (so one user can't delete another's site).
export async function deleteSite(id: string, ownerId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { data: row } = await supabase
    .from('sites')
    .select('owner_id')
    .eq('id', id)
    .maybeSingle()
  if (!row || row.owner_id !== ownerId) return false

  const keys = await listAllKeys(supabase, id)
  if (keys.length > 0) {
    await supabase.storage.from(BUCKET).remove(keys)
  }
  await supabase.from('site_submissions').delete().eq('site_id', id)
  const { error } = await supabase.from('sites').delete().eq('id', id)
  return !error
}

// Look up the email of the user who owns a site, for notifying them. Returns
// null if the site has no owner or the lookup fails.
export async function getSiteOwnerEmail(id: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data: row } = await supabase
    .from('sites')
    .select('owner_id')
    .eq('id', id)
    .maybeSingle()
  if (!row?.owner_id) return null
  const { data, error } = await supabase.auth.admin.getUserById(row.owner_id)
  if (error || !data?.user?.email) return null
  return data.user.email
}

// How many sites a given user has published (for plan-limit checks).
export async function countSitesForOwner(ownerId: string): Promise<number> {
  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from('sites')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
  if (error) return 0
  return count ?? 0
}

export interface ServedFile {
  bytes: Uint8Array
  contentType: string
  isHtml: boolean
}

const CONTENT_TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  txt: 'text/plain; charset=utf-8',
  xml: 'application/xml',
  pdf: 'application/pdf',
}

function contentTypeFor(p: string): string {
  const ext = p.split('.').pop()?.toLowerCase() ?? ''
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

// Read one file from a site by request path. An empty/"/" path or a path that
// points at a folder resolves to that folder's index.html. Returns null if
// missing or unsafe.
export async function getSiteFile(id: string, reqPath: string): Promise<ServedFile | null> {
  const rel = safeRelPath(reqPath || 'index.html')
  if (rel === null) return null
  const supabase = createAdminClient()

  let key = `${id}/${rel}`
  let dl = await supabase.storage.from(BUCKET).download(key)
  if (dl.error || !dl.data) {
    // Treat the path as a directory and look for its index.html.
    key = `${id}/${rel.replace(/\/+$/, '')}/index.html`
    dl = await supabase.storage.from(BUCKET).download(key)
    if (dl.error || !dl.data) return null
  }

  const bytes = new Uint8Array(await dl.data.arrayBuffer())
  const contentType = contentTypeFor(key)
  return { bytes, contentType, isHtml: contentType.startsWith('text/html') }
}

export async function getSiteMeta(id: string): Promise<SiteMeta | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sites')
    .select('id, name, created_at, file_count')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return { id: data.id, name: data.name, createdAt: data.created_at, fileCount: data.file_count }
}

// Lists sites for one owner. Pass no ownerId only for admin/global use.
export async function listSites(ownerId?: string): Promise<SiteMeta[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('sites')
    .select('id, name, created_at, file_count')
    .order('created_at', { ascending: false })
  if (ownerId) query = query.eq('owner_id', ownerId)
  const { data, error } = await query
  if (error || !data) return []
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    fileCount: row.file_count,
  }))
}

export async function listSubmissions(id: string): Promise<Submission[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('site_submissions')
    .select('id, name, email, message, created_at')
    .eq('site_id', id)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((row) => ({
    id: row.id,
    name: row.name ?? '',
    email: row.email ?? '',
    message: row.message ?? '',
    createdAt: row.created_at,
  }))
}

export async function addSubmission(
  id: string,
  data: { name: string; email: string; message: string }
): Promise<Submission | null> {
  if (!(await getSiteMeta(id))) return null
  const supabase = createAdminClient()
  const { data: row, error } = await supabase
    .from('site_submissions')
    .insert({ site_id: id, name: data.name, email: data.email, message: data.message })
    .select('id, name, email, message, created_at')
    .single()
  if (error || !row) return null
  return {
    id: row.id,
    name: row.name ?? '',
    email: row.email ?? '',
    message: row.message ?? '',
    createdAt: row.created_at,
  }
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

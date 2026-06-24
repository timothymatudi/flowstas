import 'server-only'
import path from 'node:path'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { addDomainToProject, removeDomainFromProject } from '@/lib/vercel'

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
  // clean slug the site is served at: <subdomain>.flowstas.com
  subdomain: string
  // connected custom domain, if any (e.g. www.yourbiz.com)
  customDomain: string | null
  // whether the site is password-protected
  hasPassword: boolean
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

// Turn a site name into a DNS-safe subdomain label: lowercase, letters/digits/
// hyphens only, no leading/trailing/double hyphens, max 40 chars. Empty if the
// name has no usable characters.
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 40)
    .replace(/-+$/g, '')
}

// Reserved labels that must never be handed out as a site subdomain (they are
// the app/marketing hosts or would shadow infrastructure).
const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'admin', 'dashboard', 'mail', 'ftp', 'blog', 'help',
  'support', 'status', 'docs', 'staging', 'dev', 'test', 'cdn', 'assets',
  'alerts', 'no-reply', 'noreply',
])

// Pick a unique, available subdomain for a new site. Tries the name slug first,
// then falls back to appending the site id (which is itself unique).
async function pickSubdomain(
  supabase: ReturnType<typeof createAdminClient>,
  name: string,
  id: string
): Promise<string> {
  const base = slugify(name)
  const candidates = base && !RESERVED_SUBDOMAINS.has(base) ? [base, `${base}-${id}`] : [`site-${id}`]
  for (const candidate of candidates) {
    const { data } = await supabase
      .from('sites')
      .select('id')
      .ilike('subdomain', candidate)
      .maybeSingle()
    if (!data) return candidate
  }
  return `site-${id}`
}

// Resolve a subdomain slug to its site id (for host-based serving). Null if none.
export async function getSiteIdBySubdomain(slug: string): Promise<string | null> {
  const clean = slug.trim().toLowerCase()
  if (!clean) return null
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sites')
    .select('id')
    .ilike('subdomain', clean)
    .maybeSingle()
  return data?.id ?? null
}

// Resolve a connected custom domain (e.g. www.yourbiz.com) to its site id.
export async function getSiteIdByCustomDomain(host: string): Promise<string | null> {
  const clean = host.trim().toLowerCase().replace(/^www\./, '')
  if (!clean) return null
  const supabase = createAdminClient()
  // Match either the bare domain or the www. form.
  const { data } = await supabase
    .from('sites')
    .select('id, custom_domain')
    .or(`custom_domain.ilike.${clean},custom_domain.ilike.www.${clean}`)
    .maybeSingle()
  return data?.id ?? null
}

// Connect or disconnect a custom domain (owner-checked). Validates the domain,
// ensures it isn't taken, attaches it on Vercel, then stores it. Returns an
// error message or null on success.
export async function setCustomDomain(id: string, ownerId: string, domain: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data: row } = await supabase.from('sites').select('owner_id, custom_domain').eq('id', id).maybeSingle()
  if (!row || row.owner_id !== ownerId) return 'Site not found.'

  const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  // Clearing the domain.
  if (!clean) {
    if (row.custom_domain) await removeDomainFromProject(row.custom_domain)
    const { error } = await supabase.from('sites').update({ custom_domain: null }).eq('id', id)
    return error ? error.message : null
  }
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(clean) || clean.endsWith('.flowstas.com')) {
    return 'Enter a valid domain you own, e.g. www.yourbusiness.com.'
  }
  const { data: taken } = await supabase
    .from('sites').select('id').ilike('custom_domain', clean).neq('id', id).maybeSingle()
  if (taken) return 'That domain is already connected to another site.'

  const added = await addDomainToProject(clean)
  if (!added.ok) return added.error

  const { error } = await supabase.from('sites').update({ custom_domain: clean }).eq('id', id)
  return error ? error.message : null
}

// --- Per-site secrets (password gate) ---
const SITE_SECRET = process.env.SUPABASE_JWT_SECRET || 'flowstas-fallback-secret'
function sign(...parts: string[]): string {
  return crypto.createHmac('sha256', SITE_SECRET).update(parts.join(':')).digest('hex')
}

export function unlockCookieName(id: string): string {
  return `flowstas_unlock_${id}`
}
// The capability token a visitor's cookie must hold to view a protected site.
export function unlockToken(passwordHash: string): string {
  return sign('cookie', passwordHash)
}
export function checkSitePassword(id: string, passwordHash: string, password: string): boolean {
  return sign('pw', id, password) === passwordHash
}

// Fetch the password hash for a site (null = public).
export async function getSitePasswordHash(id: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('sites').select('password_hash').eq('id', id).maybeSingle()
  return data?.password_hash ?? null
}

// Set or clear a site's password (owner-checked). Empty password clears it.
export async function setSitePassword(id: string, ownerId: string, password: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data: row } = await supabase.from('sites').select('owner_id').eq('id', id).maybeSingle()
  if (!row || row.owner_id !== ownerId) return 'Site not found.'
  const password_hash = password.trim() ? sign('pw', id, password.trim()) : null
  const { error } = await supabase.from('sites').update({ password_hash }).eq('id', id)
  return error ? error.message : null
}

// --- Analytics ---
// Record one page view for a site (per-day counter). Best-effort.
export async function recordView(id: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.rpc('flowstas_record_view', { p_site: id })
}

// One recorded page view, with the little context we can see server-side.
export interface Visit {
  id: string
  createdAt: string
  path: string | null
  referrer: string | null
  country: string | null
  device: string | null
}

// Append one visit to the per-visit log. Best-effort: if the site_visits table
// hasn't been provisioned yet (scripts/add-visits.sql), this quietly no-ops so
// serving a site is never blocked by analytics.
export async function logVisit(
  id: string,
  meta: { path?: string | null; referrer?: string | null; country?: string | null; device?: string | null }
): Promise<void> {
  const supabase = createAdminClient()
  try {
    await supabase.from('site_visits').insert({
      site_id: id,
      path: meta.path ?? null,
      referrer: meta.referrer ?? null,
      country: meta.country ?? null,
      device: meta.device ?? null,
    })
  } catch {
    // ignore — analytics must never break the site
  }
}

// Recent visits for a site, newest first. Returns [] if the log table is
// missing so the visitors page degrades gracefully to daily counts.
export async function listVisits(id: string, limit = 50): Promise<Visit[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('site_visits')
    .select('id, created_at, path, referrer, country, device')
    .eq('site_id', id)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map((row) => ({
    id: String(row.id),
    createdAt: row.created_at,
    path: row.path ?? null,
    referrer: row.referrer ?? null,
    country: row.country ?? null,
    device: row.device ?? null,
  }))
}

export interface ViewStats {
  total: number
  days: { day: string; views: number }[] // last 7 days, oldest first
}
export async function getViewStats(id: string): Promise<ViewStats> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('site_view_stats')
    .select('day, views')
    .eq('site_id', id)
    .order('day', { ascending: true })
  const rows = data ?? []
  const total = rows.reduce((s, r) => s + (r.views ?? 0), 0)
  // Build a dense last-7-day series (fill gaps with 0).
  const byDay = new Map(rows.map((r) => [r.day, r.views as number]))
  const days: { day: string; views: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ day: key, views: byDay.get(key) ?? 0 })
  }
  return { total, days }
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

// Clean + de-dupe an uploaded file set: drop directory entries / macOS cruft,
// normalise paths, strip a common top folder, and guarantee the entry page is
// reachable at "/" (also written as index.html). Throws if there's no HTML.
function prepareSiteFiles(files: SiteFile[]): SiteFile[] {
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

  if (entry.toLowerCase() !== 'index.html' && !rooted.some((f) => f.path === 'index.html')) {
    const e = rooted.find((f) => f.path === entry)!
    rooted.push({ path: 'index.html', bytes: e.bytes })
  }
  return rooted
}

// Upload a prepared file set into the bucket under "<id>/...". Throws on failure.
async function uploadSiteFiles(
  supabase: ReturnType<typeof createAdminClient>,
  id: string,
  rooted: SiteFile[]
): Promise<void> {
  for (const f of rooted) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${id}/${f.path}`, Buffer.from(f.bytes), {
        contentType: contentTypeFor(f.path),
        upsert: true,
      })
    if (error) throw new Error(`Could not store ${f.path}: ${error.message}`)
  }
}

export async function createSite(
  name: string,
  files: SiteFile[],
  ownerId?: string
): Promise<SiteMeta> {
  const rooted = prepareSiteFiles(files)

  const id = newId()
  const supabase = createAdminClient()
  await uploadSiteFiles(supabase, id, rooted)

  const subdomain = await pickSubdomain(supabase, name.trim() || 'Untitled site', id)
  const meta: SiteMeta = {
    id,
    name: name.trim() || 'Untitled site',
    createdAt: new Date().toISOString(),
    fileCount: rooted.length,
    subdomain,
    customDomain: null,
    hasPassword: false,
  }
  const { error: dbError } = await supabase.from('sites').insert({
    id: meta.id,
    name: meta.name,
    file_count: meta.fileCount,
    created_at: meta.createdAt,
    owner_id: ownerId ?? null,
    subdomain: meta.subdomain,
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

// Rename a site and/or change its subdomain. Ownership-checked; validates the
// new subdomain (DNS-safe, not reserved, not taken by another site). Returns an
// error message on failure, or null on success.
export async function updateSite(
  id: string,
  ownerId: string,
  fields: { name?: string; subdomain?: string }
): Promise<string | null> {
  const supabase = createAdminClient()
  const { data: row } = await supabase
    .from('sites')
    .select('owner_id')
    .eq('id', id)
    .maybeSingle()
  if (!row || row.owner_id !== ownerId) return 'Site not found.'

  const update: { name?: string; subdomain?: string } = {}
  if (fields.name !== undefined) update.name = fields.name.trim() || 'Untitled site'
  if (fields.subdomain !== undefined) {
    const slug = slugify(fields.subdomain)
    if (!slug) return 'Pick a subdomain using letters, numbers or hyphens.'
    if (RESERVED_SUBDOMAINS.has(slug)) return 'That subdomain is reserved — pick another.'
    const { data: taken } = await supabase
      .from('sites')
      .select('id')
      .ilike('subdomain', slug)
      .neq('id', id)
      .maybeSingle()
    if (taken) return 'That subdomain is already taken — pick another.'
    update.subdomain = slug
  }

  const { error } = await supabase.from('sites').update(update).eq('id', id)
  return error ? error.message : null
}

// Replace a site's content with a fresh file set, keeping its id/subdomain/owner.
// Ownership-checked. Removes the old files first, then uploads the new ones.
export async function replaceSiteFiles(
  id: string,
  ownerId: string,
  files: SiteFile[]
): Promise<string | null> {
  const supabase = createAdminClient()
  const { data: row } = await supabase
    .from('sites')
    .select('owner_id')
    .eq('id', id)
    .maybeSingle()
  if (!row || row.owner_id !== ownerId) return 'Site not found.'

  let rooted: SiteFile[]
  try {
    rooted = prepareSiteFiles(files)
  } catch (err) {
    return err instanceof Error ? err.message : 'Could not read those files.'
  }

  // Clear the existing files so removed pages don't linger, then upload anew.
  const oldKeys = await listAllKeys(supabase, id)
  if (oldKeys.length > 0) await supabase.storage.from(BUCKET).remove(oldKeys)
  await uploadSiteFiles(supabase, id, rooted)

  const { error } = await supabase
    .from('sites')
    .update({ file_count: rooted.length })
    .eq('id', id)
  return error ? error.message : null
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
    .select('id, name, created_at, file_count, subdomain, custom_domain, password_hash')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return {
    id: data.id,
    name: data.name,
    createdAt: data.created_at,
    fileCount: data.file_count,
    subdomain: data.subdomain ?? data.id,
    customDomain: data.custom_domain ?? null,
    hasPassword: !!data.password_hash,
  }
}

// Lists sites for one owner. Pass no ownerId only for admin/global use.
export async function listSites(ownerId?: string): Promise<SiteMeta[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('sites')
    .select('id, name, created_at, file_count, subdomain, custom_domain, password_hash')
    .order('created_at', { ascending: false })
  if (ownerId) query = query.eq('owner_id', ownerId)
  const { data, error } = await query
  if (error || !data) return []
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    fileCount: row.file_count,
    subdomain: row.subdomain ?? row.id,
    customDomain: row.custom_domain ?? null,
    hasPassword: !!row.password_hash,
  }))
}

// Admin-only: every site across all owners, newest first, tagged with its
// owner id so the dashboard can label whose site it is.
export async function listAllSites(): Promise<Array<SiteMeta & { ownerId: string }>> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sites')
    .select('id, name, created_at, file_count, subdomain, custom_domain, password_hash, owner_id')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    fileCount: row.file_count,
    subdomain: row.subdomain ?? row.id,
    customDomain: row.custom_domain ?? null,
    hasPassword: !!row.password_hash,
    ownerId: row.owner_id ?? '',
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

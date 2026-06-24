import 'server-only'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Store for deployed COMPUTE apps (full apps that build + run on Fly), the
// compute sibling of lib/site-store.ts. The actual build/run lives on Fly,
// driven by the build worker (lib/build-worker.ts); this is Flowstas's record
// of which app belongs to whom and its current state.
// Run scripts/apps-tables.sql once to provision the tables.

export type AppStatus = 'building' | 'live' | 'error' | 'stopped'

export interface AppMeta {
  id: string
  name: string
  repo: string
  branch: string | null
  flyApp: string
  url: string | null
  customDomain: string | null
  status: AppStatus
  lastError: string | null
  // Real client-side PUBLIC build-time env (NEXT_PUBLIC_*, VITE_*, …) that must
  // be baked into the build so browser bundles aren't frozen to placeholders.
  // These are not secrets (they ship in the browser), so we persist them; server
  // secrets are never stored here — they live only as Fly runtime secrets.
  buildEnv: Record<string, string> | null
  createdAt: string
  updatedAt: string
}

function newId() {
  return crypto.randomBytes(4).toString('hex')
}

// --- GitHub token at rest (AES-256-GCM) --------------------------------------
// Private-repo deploys need a GitHub token to clone. We encrypt it at rest so a
// redeploy (dashboard button or push webhook) can re-clone without re-prompting.
// The key lives only in the APP_TOKEN_ENC_KEY env var (32 bytes, base64) — never
// in the DB — so a DB leak alone can't decrypt stored tokens.
function tokenEncKey(): Buffer {
  const raw = process.env.APP_TOKEN_ENC_KEY
  if (!raw) throw new Error('APP_TOKEN_ENC_KEY is not set — cannot encrypt GitHub tokens.')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('APP_TOKEN_ENC_KEY must decode to 32 bytes (base64).')
  return key
}

// Returns base64(iv[12] | authTag[16] | ciphertext).
function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', tokenEncKey(), iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ct]).toString('base64')
}

function decryptToken(stored: string): string {
  const buf = Buffer.from(stored, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const ct = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', tokenEncKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}

// A Fly app name: lowercase letters/digits/hyphens, globally unique. We prefix
// "flowstas-" so customer apps are namespaced, add a slug from the name for
// readability, and suffix the id to guarantee uniqueness.
function flyAppName(name: string, id: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
    .replace(/-+$/g, '')
  return `flowstas-${slug ? `${slug}-` : ''}${id}`
}

function rowToMeta(row: Record<string, unknown>): AppMeta {
  return {
    id: row.id as string,
    name: row.name as string,
    repo: row.repo as string,
    branch: (row.branch as string) ?? null,
    flyApp: row.fly_app as string,
    url: (row.url as string) ?? null,
    customDomain: (row.custom_domain as string) ?? null,
    status: row.status as AppStatus,
    lastError: (row.last_error as string) ?? null,
    buildEnv: (row.build_env as Record<string, string>) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// Create the app record (status "building"). The deploy itself is kicked off by
// the caller via the build worker; updateAppDeploy records the outcome.
export async function createApp(
  name: string,
  repo: string,
  branch: string | null,
  ownerId: string
): Promise<AppMeta> {
  const id = newId()
  const cleanName = name.trim() || 'Untitled app'
  const flyApp = flyAppName(cleanName, id)
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { error } = await supabase.from('apps').insert({
    id,
    owner_id: ownerId,
    name: cleanName,
    repo,
    branch,
    fly_app: flyApp,
    status: 'building',
    created_at: now,
    updated_at: now,
  })
  if (error) throw new Error(`Could not save your app: ${error.message}`)

  return {
    id,
    name: cleanName,
    repo,
    branch,
    flyApp,
    url: null,
    customDomain: null,
    status: 'building',
    lastError: null,
    buildEnv: null,
    createdAt: now,
    updatedAt: now,
  }
}

// Persist the app's PUBLIC build-time env (client-side values that must be baked
// into the build, e.g. NEXT_PUBLIC_*). Merges with any existing values so a
// partial update doesn't drop previously saved keys. Returns false if the app
// doesn't exist or isn't the caller's. Server secrets must NOT be passed here.
export async function setAppBuildEnv(
  id: string,
  ownerId: string,
  env: Record<string, string>
): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: row } = await supabase
    .from('apps')
    .select('owner_id, build_env')
    .eq('id', id)
    .maybeSingle()
  if (!row || row.owner_id !== ownerId) return false
  const existing = (row.build_env as Record<string, string>) ?? {}
  const merged = { ...existing, ...env }
  await supabase
    .from('apps')
    .update({ build_env: merged, updated_at: new Date().toISOString() })
    .eq('id', id)
  return true
}

// Store the encrypted GitHub token for an app the user owns, so private-repo
// redeploys can re-clone. Pass null to clear it. Best-effort caller — encryption
// requires APP_TOKEN_ENC_KEY; if that's unset this throws and the caller decides.
export async function setAppGithubToken(
  id: string,
  ownerId: string,
  token: string | null
): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: row } = await supabase.from('apps').select('owner_id').eq('id', id).maybeSingle()
  if (!row || row.owner_id !== ownerId) return false
  await supabase
    .from('apps')
    .update({
      github_token_enc: token ? encryptToken(token) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  return true
}

// Decrypt and return an app's stored GitHub token, or null if none/invalid.
// Looked up by app id only (the push webhook is HMAC-authed and has no owner
// context); callers that act on a user's behalf must check ownership first.
export async function getAppGithubToken(id: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('apps')
    .select('github_token_enc')
    .eq('id', id)
    .maybeSingle()
  const enc = data?.github_token_enc as string | undefined
  if (!enc) return null
  try {
    return decryptToken(enc)
  } catch {
    return null
  }
}

// Record the outcome of a build/deploy: live (with url) or error (with reason),
// plus the captured logs for replay in the dashboard.
export async function updateAppDeploy(
  id: string,
  result: { ok: true; url: string } | { ok: false; error: string },
  logs: string
): Promise<void> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  await supabase
    .from('apps')
    .update(
      result.ok
        ? { status: 'live', url: result.url, last_error: null, updated_at: now }
        : { status: 'error', last_error: result.error.slice(0, 500), updated_at: now }
    )
    .eq('id', id)
  await supabase.from('app_deploys').insert({
    app_id: id,
    status: result.ok ? 'live' : 'error',
    logs: logs.slice(0, 100_000),
  })
}

export async function getApp(id: string, ownerId: string): Promise<AppMeta | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('apps').select('*').eq('id', id).maybeSingle()
  if (!data || data.owner_id !== ownerId) return null
  return rowToMeta(data)
}

// The captured build/deploy logs from the app's most recent deploy. Used to
// give the AI assistant the raw output it needs to explain a failure.
export async function getLatestDeployLog(appId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('app_deploys')
    .select('logs')
    .eq('app_id', appId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.logs as string) ?? null
}

export async function listApps(ownerId: string): Promise<AppMeta[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('apps')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(rowToMeta)
}

// Admin-only: every app across all owners, newest first, tagged with its
// owner id so the dashboard can label whose app it is.
export async function listAllApps(): Promise<Array<AppMeta & { ownerId: string }>> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('apps').select('*').order('created_at', { ascending: false })
  return (data ?? []).map((row) => ({ ...rowToMeta(row), ownerId: (row.owner_id as string) ?? '' }))
}

// Find apps deployed from a given repo (any owner). Used by the GitHub webhook
// to know which app(s) to redeploy when code is pushed. Repo match is
// case-insensitive and ignores a trailing ".git" or slash.
export async function listAppsByRepo(repo: string): Promise<AppMeta[]> {
  const clean = repo.trim().toLowerCase().replace(/\.git$/, '').replace(/\/$/, '')
  if (!clean) return []
  const supabase = createAdminClient()
  const { data } = await supabase.from('apps').select('*')
  return (data ?? [])
    .map(rowToMeta)
    .filter((a) => a.repo.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '') === clean)
}

export async function countAppsForOwner(ownerId: string): Promise<number> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('apps')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
  return count ?? 0
}

// Set status (e.g. stopped/live) for an app the user owns. Returns false if the
// app doesn't exist or isn't theirs.
export async function setAppStatus(
  id: string,
  ownerId: string,
  status: AppStatus
): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: row } = await supabase.from('apps').select('owner_id').eq('id', id).maybeSingle()
  if (!row || row.owner_id !== ownerId) return false
  await supabase
    .from('apps')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  return true
}

// Store a connected custom domain for an app the user owns.
export async function setAppCustomDomain(
  id: string,
  ownerId: string,
  domain: string | null
): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: row } = await supabase.from('apps').select('owner_id').eq('id', id).maybeSingle()
  if (!row || row.owner_id !== ownerId) return false
  await supabase
    .from('apps')
    .update({ custom_domain: domain, updated_at: new Date().toISOString() })
    .eq('id', id)
  return true
}

export async function deleteApp(id: string, ownerId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: row } = await supabase.from('apps').select('owner_id').eq('id', id).maybeSingle()
  if (!row || row.owner_id !== ownerId) return false
  await supabase.from('apps').delete().eq('id', id)
  return true
}

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
  createdAt: string
  updatedAt: string
}

function newId() {
  return crypto.randomBytes(4).toString('hex')
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
    createdAt: now,
    updatedAt: now,
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

export async function listApps(ownerId: string): Promise<AppMeta[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('apps')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(rowToMeta)
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

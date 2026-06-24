import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { countSitesForOwner } from '@/lib/site-store'
import { countAppsForOwner } from '@/lib/app-store'
import type { User } from '@supabase/supabase-js'

// Allowlisted platform admins. An admin sees EVERY user's apps and sites in the
// dashboard (labelled with the owner's email), not just their own. Set the
// FLOWSTAS_ADMIN_EMAILS env var to a comma-separated list of emails.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allow = (process.env.FLOWSTAS_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allow.includes(email.toLowerCase())
}

// Map of auth user id -> email for every user, for labelling rows in admin
// views. Paginates through the Supabase admin API.
export async function ownerEmailMap(): Promise<Map<string, string>> {
  const supabase = createAdminClient()
  const map = new Map<string, string>()
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) break
    for (const u of data.users) if (u.email) map.set(u.id, u.email)
    if (data.users.length < 200) break
  }
  return map
}

// Returns the signed-in user IF they are an allowlisted admin, else null. Use
// this to gate admin-only pages and server actions on the server.
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}

export interface AdminUserRow {
  id: string
  email: string
  fullName: string | null
  createdAt: string
  lastSignInAt: string | null
  confirmed: boolean
  suspended: boolean
  sitesCount: number
  appsCount: number
}

// Every account on the platform, enriched with site/app counts and status, for
// the Admin → Users page. Newest first.
export async function listAllUsers(): Promise<AdminUserRow[]> {
  const supabase = createAdminClient()
  const users: User[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) break
    users.push(...data.users)
    if (data.users.length < 200) break
  }
  const rows = await Promise.all(
    users.map(async (u) => {
      const [sitesCount, appsCount] = await Promise.all([
        countSitesForOwner(u.id),
        countAppsForOwner(u.id),
      ])
      const bannedUntil = (u as User & { banned_until?: string }).banned_until
      return {
        id: u.id,
        email: u.email ?? '(no email)',
        fullName: (u.user_metadata?.full_name as string) ?? null,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        confirmed: Boolean(u.email_confirmed_at),
        suspended: Boolean(bannedUntil && new Date(bannedUntil) > new Date()),
        sitesCount,
        appsCount,
      }
    })
  )
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

// One account's basic profile/status for the drill-down page, or null if the
// id doesn't exist. (Site/app counts come from listSites/listApps separately.)
export async function getUserBasic(
  id: string
): Promise<Omit<AdminUserRow, 'sitesCount' | 'appsCount'> | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.auth.admin.getUserById(id)
  const u = data?.user
  if (error || !u) return null
  const bannedUntil = (u as User & { banned_until?: string }).banned_until
  return {
    id: u.id,
    email: u.email ?? '(no email)',
    fullName: (u.user_metadata?.full_name as string) ?? null,
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? null,
    confirmed: Boolean(u.email_confirmed_at),
    suspended: Boolean(bannedUntil && new Date(bannedUntil) > new Date()),
  }
}

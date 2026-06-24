import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

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

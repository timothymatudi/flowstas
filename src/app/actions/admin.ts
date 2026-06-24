'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/admin'

export type AdminActionResult = { ok: true } | { ok: false; error: string }

// A ~100-year ban = "suspended". Supabase clears the ban with 'none'.
const BAN_FOREVER = '876000h'

// Set (reset) a user's password. Admin-only.
export async function adminSetPasswordAction(
  userId: string,
  password: string
): Promise<AdminActionResult> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized.' }
  if (!userId) return { ok: false, error: 'Missing user.' }
  if (!password || password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.updateUserById(userId, { password })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// Suspend or un-suspend a user (a suspended user cannot sign in). Admin-only.
// An admin cannot suspend their own account.
export async function adminSetSuspendedAction(
  userId: string,
  suspended: boolean
): Promise<AdminActionResult> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized.' }
  if (!userId) return { ok: false, error: 'Missing user.' }
  if (userId === admin.id) return { ok: false, error: "You can't suspend your own account." }

  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: suspended ? BAN_FOREVER : 'none',
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/users')
  return { ok: true }
}

// Permanently delete a user account. Admin-only. An admin cannot delete their
// own account. (Their sites/apps records are left intact; this only removes the
// auth account.)
export async function adminDeleteUserAction(userId: string): Promise<AdminActionResult> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized.' }
  if (!userId) return { ok: false, error: 'Missing user.' }
  if (userId === admin.id) return { ok: false, error: "You can't delete your own account." }

  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/users')
  return { ok: true }
}

'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function signUpAction(email: string, password: string) {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Try to create the user with email already confirmed
  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    // User already exists — find and confirm + update password
    const { data: list, error: listError } = await admin.auth.admin.listUsers()
    if (listError) return { error: listError.message }

    const existing = list.users.find(u => u.email === email)
    if (!existing) return { error: createError.message }

    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password,
    })
    if (updateError) return { error: updateError.message }
  }

  // Sign in server-side so session cookies are set before redirect
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) return { error: signInError.message }

  return { success: true }
}

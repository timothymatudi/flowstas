'use server'

import { createClient } from '@supabase/supabase-js'

export async function signUpAction(email: string, password: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) return { error: error.message }
  return { success: true, userId: data.user?.id }
}

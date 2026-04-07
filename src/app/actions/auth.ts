'use server'

import { createClient } from '@/lib/supabase/server'

export async function signUpAction(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Check your email for a confirmation link' }
}

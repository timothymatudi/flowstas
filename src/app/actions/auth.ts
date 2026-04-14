'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUpAction(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'https://flowstas.com/auth/callback',
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Email confirmation is disabled — session returned immediately, redirect to dashboard
  if (data.session) {
    redirect('/dashboard')
  }

  // Email confirmation is enabled — tell user to check email
  return { success: true }
}

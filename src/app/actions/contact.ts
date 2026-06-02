'use server'

import { createClient } from '@/lib/supabase/server'

export interface ContactInput {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
}

export async function submitContact(input: ContactInput) {
  const supabase = await createClient()

  const { error } = await supabase.from('contact_messages').insert({
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    subject: input.subject,
    message: input.message,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

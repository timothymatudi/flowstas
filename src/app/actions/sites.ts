'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { deleteSite } from '@/lib/site-store'

// Delete a site the signed-in user owns. deleteSite() re-checks ownership, so a
// user can only ever remove their own sites.
export async function deleteSiteAction(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await deleteSite(id, user.id)
  revalidatePath('/sites')
}

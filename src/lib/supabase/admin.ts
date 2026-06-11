import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Service-role client for server-side operations on published sites:
// reads/writes Storage and the sites/site_submissions tables, bypassing RLS.
// Never import this into client code — it holds the secret key.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

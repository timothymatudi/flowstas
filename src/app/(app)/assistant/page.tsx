import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GlobalAssistant } from '@/components/global-assistant'

export const dynamic = 'force-dynamic'

export default async function AssistantPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <GlobalAssistant />
        </div>
      </div>
    </main>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardContent from '@/components/dashboard-content'
import { AdminOverview } from '@/components/admin-overview'
import { isAdminEmail, getPlatformStats } from '@/lib/admin'
import { listSites, listSubmissions } from '@/lib/site-store'
import { listApps } from '@/lib/app-store'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Admins get a platform control panel instead of the personal onboarding.
  if (isAdminEmail(user.email)) {
    const stats = await getPlatformStats()
    return <AdminOverview stats={stats} adminName={user.email ?? 'Admin'} />
  }

  // Get subscription data
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get real counts for this user
  const [sites, apps] = await Promise.all([
    listSites(user.id),
    listApps(user.id),
  ])

  // Sum contact-form messages across this user's sites
  const submissionCounts = await Promise.all(
    sites.map((site) => listSubmissions(site.id).then((s) => s.length))
  )
  const messagesCount = submissionCounts.reduce((sum, n) => sum + n, 0)

  return (
    <DashboardContent
      user={user}
      subscription={subscription}
      profile={profile}
      sitesCount={sites.length}
      appsCount={apps.length}
      messagesCount={messagesCount}
    />
  )
}

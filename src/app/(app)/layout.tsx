import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard-nav'
import { isTrialActive } from '@/lib/plan-limits'

// Shell for all logged-in product pages: /dashboard, /publish, /sites,
// /deploy, /apps, /assistant (and nested billing/settings). Requires auth and
// renders the dashboard sidebar instead of the marketing header/footer.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  // Get subscription status (any state, so a live trial shows in the nav too).
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status, trial_ends_at')
    .eq('user_id', user.id)
    .maybeSingle()

  // What to badge in the nav: the paid plan when active, "Trial" during a live
  // trial, otherwise nothing (the nav shows an Upgrade button instead).
  let navSubscription: { plan: string; status: string } | null = null
  if (subscription?.status === 'active' && subscription.plan) {
    navSubscription = { plan: subscription.plan, status: 'active' }
  } else if (isTrialActive(subscription)) {
    navSubscription = { plan: 'Trial', status: 'trialing' }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav
        user={user}
        profile={profile}
        subscription={navSubscription}
      />
      <main className="lg:pl-64">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

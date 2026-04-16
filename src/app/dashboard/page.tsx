import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Activity,
  BarChart3,
  Zap,
  ArrowRight
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  // Get subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .single()

  const displayName = profile?.full_name || user!.email?.split('@')[0] || 'there'
  const hasSubscription = !!subscription

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {displayName}</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        {!hasSubscription && (
          <Button asChild>
            <Link href="/pricing">
              <Zap className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Link>
          </Button>
        )}
      </div>

      {/* Subscription Status Card */}
      {!hasSubscription && (
        <Card className="border-dashed bg-muted/50">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">You&apos;re on the Free Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to unlock advanced features and analytics.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/pricing">View Plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value="$12,450"
          change="+12.5%"
          trend="up"
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatsCard
          title="Active Users"
          value="2,340"
          change="+8.2%"
          trend="up"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Conversion Rate"
          value="3.2%"
          change="-0.4%"
          trend="down"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Active Sessions"
          value="1,429"
          change="+21.3%"
          trend="up"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <QuickActionItem
              href="/dashboard/analytics"
              icon={<BarChart3 className="h-5 w-5" />}
              title="View Analytics"
              description="Check your performance metrics"
            />
            <QuickActionItem
              href="/dashboard/billing"
              icon={<CreditCard className="h-5 w-5" />}
              title="Manage Billing"
              description="Update payment methods and invoices"
            />
            <QuickActionItem
              href="/dashboard/settings"
              icon={<Users className="h-5 w-5" />}
              title="Account Settings"
              description="Update your profile and preferences"
            />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityItem
                title="Account created"
                description="Welcome to Flowstas!"
                time="Just now"
              />
              <ActivityItem
                title="Email verified"
                description="Your email has been confirmed"
                time="1 minute ago"
              />
              <ActivityItem
                title="Profile updated"
                description="Personal information saved"
                time="5 minutes ago"
              />
              <ActivityItem
                title="Dashboard accessed"
                description="First login to dashboard"
                time="10 minutes ago"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Complete these steps to make the most of Flowstas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <GettingStartedItem
              step={1}
              title="Set up your profile"
              description="Add your name and avatar"
              href="/dashboard/settings"
              completed={!!profile?.full_name}
            />
            <GettingStartedItem
              step={2}
              title="Choose a plan"
              description="Select a subscription that fits your needs"
              href="/pricing"
              completed={hasSubscription}
            />
            <GettingStartedItem
              step={3}
              title="Explore analytics"
              description="View your business insights"
              href="/dashboard/analytics"
              completed={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon 
}: { 
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          <span className={`flex items-center text-xs font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionItem({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  )
}

function ActivityItem({
  title,
  description,
  time,
}: {
  title: string
  description: string
  time: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <div className="text-xs text-muted-foreground whitespace-nowrap">{time}</div>
    </div>
  )
}

function GettingStartedItem({
  step,
  title,
  description,
  href,
  completed,
}: {
  step: number
  title: string
  description: string
  href: string
  completed: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted ${
        completed ? 'border-green-200 bg-green-50/50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          completed 
            ? 'bg-green-600 text-white' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {completed ? '✓' : step}
        </div>
        {completed && <Badge variant="secondary" className="text-xs">Complete</Badge>}
      </div>
      <div className="font-medium">{title}</div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </Link>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Users,
  CreditCard,
  Activity,
  BarChart3,
  Settings,
  Zap,
  ArrowRight
} from 'lucide-react'
import { PRODUCTS } from '@/lib/products'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Get subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const currentPlan = subscription 
    ? PRODUCTS.find(p => p.id === subscription.plan) 
    : null

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {displayName}</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your account today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Subscription Status Card */}
      {!subscription && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Upgrade to unlock all features</h3>
                  <p className="text-muted-foreground">
                    You&apos;re on the free plan. Upgrade to get unlimited access to all features.
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href="/pricing">
                  View Plans
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$12,426"
          change="+12.5%"
          trend="up"
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatCard
          title="Active Users"
          value="1,234"
          change="+8.2%"
          trend="up"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Conversion Rate"
          value="3.2%"
          change="-0.4%"
          trend="down"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Active Sessions"
          value="573"
          change="+24.1%"
          trend="up"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Activity Chart Placeholder */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Your activity over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Activity chart</p>
                <p className="text-xs text-muted-foreground mt-1">Data visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Plan / Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentPlan ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{currentPlan.name}</p>
                    <p className="text-sm text-muted-foreground">{currentPlan.description}</p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">API Requests</span>
                    <span className="font-medium">7,234 / 10,000</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/dashboard/billing">Manage Billing</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/pricing">Upgrade</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  No active subscription
                </p>
                <Button asChild>
                  <Link href="/pricing">Choose a Plan</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
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
                title="Profile updated"
                description="You updated your profile information"
                time="2 hours ago"
              />
              <ActivityItem
                title="Signed in"
                description="New session started"
                time="Today"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionButton
                href="/dashboard/analytics"
                icon={<BarChart3 className="h-4 w-4" />}
                label="View Analytics"
              />
              <QuickActionButton
                href="/dashboard/billing"
                icon={<CreditCard className="h-4 w-4" />}
                label="Billing"
              />
              <QuickActionButton
                href="/dashboard/settings"
                icon={<Settings className="h-4 w-4" />}
                label="Settings"
              />
              <QuickActionButton
                href="/pricing"
                icon={<Zap className="h-4 w-4" />}
                label="Upgrade Plan"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon,
}: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ReactNode
}) {
  const isPositive = trend === 'up'
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center mt-1">
          <span className={`flex items-center text-xs font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-0.5" />
            )}
            {change}
          </span>
          <span className="text-xs text-muted-foreground ml-1">vs last month</span>
        </div>
      </CardContent>
    </Card>
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
    <div className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
    </div>
  )
}

function QuickActionButton({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
      <Link href={href}>
        {icon}
        <span className="text-xs">{label}</span>
      </Link>
    </Button>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Clock,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your performance and understand your audience.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Page Views"
              value="24,532"
              change="+12.3%"
              trend="up"
              period="vs last month"
            />
            <MetricCard
              title="Unique Visitors"
              value="8,491"
              change="+8.7%"
              trend="up"
              period="vs last month"
            />
            <MetricCard
              title="Avg. Session Duration"
              value="4m 32s"
              change="-2.1%"
              trend="down"
              period="vs last month"
            />
            <MetricCard
              title="Bounce Rate"
              value="42.3%"
              change="-5.2%"
              trend="up"
              period="vs last month"
            />
          </div>

          {/* Charts Placeholder */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Over Time</CardTitle>
                <CardDescription>Daily visitors for the past 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Chart visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <TopPageItem page="/" views="8,234" percentage={100} />
                  <TopPageItem page="/pricing" views="3,421" percentage={42} />
                  <TopPageItem page="/dashboard" views="2,891" percentage={35} />
                  <TopPageItem page="/auth/sign-up" views="1,234" percentage={15} />
                  <TopPageItem page="/auth/login" views="982" percentage={12} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>How users access your site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <DeviceItem 
                    icon={<Monitor className="h-4 w-4" />} 
                    device="Desktop" 
                    percentage={58}
                    users="4,925"
                  />
                  <DeviceItem 
                    icon={<Smartphone className="h-4 w-4" />} 
                    device="Mobile" 
                    percentage={35}
                    users="2,972"
                  />
                  <DeviceItem 
                    icon={<Monitor className="h-4 w-4" />} 
                    device="Tablet" 
                    percentage={7}
                    users="594"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Top Locations */}
            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
                <CardDescription>Where your visitors are from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <LocationItem country="United States" users="3,421" percentage={40} />
                  <LocationItem country="United Kingdom" users="1,234" percentage={15} />
                  <LocationItem country="Germany" users="891" percentage={10} />
                  <LocationItem country="Canada" users="678" percentage={8} />
                  <LocationItem country="Australia" users="534" percentage={6} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">New Users</p>
                    <p className="text-2xl font-bold">1,429</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Returning Users</p>
                    <p className="text-2xl font-bold">7,062</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Time on Site</p>
                    <p className="text-2xl font-bold">4m 32s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TrafficSourceItem source="Organic Search" visits="4,532" percentage={35} />
                <TrafficSourceItem source="Direct" visits="3,891" percentage={30} />
                <TrafficSourceItem source="Social Media" visits="2,156" percentage={17} />
                <TrafficSourceItem source="Referral" visits="1,543" percentage={12} />
                <TrafficSourceItem source="Email" visits="778" percentage={6} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
                <CardDescription>Sites sending you the most traffic</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ReferrerItem domain="google.com" visits="4,532" />
                  <ReferrerItem domain="twitter.com" visits="1,234" />
                  <ReferrerItem domain="linkedin.com" visits="891" />
                  <ReferrerItem domain="producthunt.com" visits="543" />
                  <ReferrerItem domain="reddit.com" visits="321" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Search Terms</CardTitle>
                <CardDescription>Keywords bringing visitors to your site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <SearchTermItem term="flowstas" visits="1,234" />
                  <SearchTermItem term="subscription management" visits="891" />
                  <SearchTermItem term="saas analytics" visits="543" />
                  <SearchTermItem term="business dashboard" visits="321" />
                  <SearchTermItem term="payment processing" visits="234" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({
  title,
  value,
  change,
  trend,
  period,
}: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  period: string
}) {
  const isPositive = trend === 'up' && !change.startsWith('-')
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className={`flex items-center text-xs font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3 mr-0.5" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-0.5" />
            )}
            {change}
          </span>
          <span className="text-xs text-muted-foreground">{period}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function TopPageItem({ page, views, percentage }: { page: string; views: string; percentage: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{page}</p>
        <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full" 
            style={{ width: `${percentage}%` }} 
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground whitespace-nowrap">{views}</p>
    </div>
  )
}

function DeviceItem({ 
  icon, 
  device, 
  percentage, 
  users 
}: { 
  icon: React.ReactNode
  device: string
  percentage: number
  users: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{device}</span>
          <span className="text-sm text-muted-foreground">{users}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full" 
            style={{ width: `${percentage}%` }} 
          />
        </div>
      </div>
    </div>
  )
}

function LocationItem({ country, users, percentage }: { country: string; users: string; percentage: number }) {
  return (
    <div className="flex items-center gap-4">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{country}</span>
          <span className="text-sm text-muted-foreground">{users}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full" 
            style={{ width: `${percentage}%` }} 
          />
        </div>
      </div>
    </div>
  )
}

function TrafficSourceItem({ source, visits, percentage }: { source: string; visits: string; percentage: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{source}</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{percentage}%</Badge>
            <span className="text-sm text-muted-foreground">{visits}</span>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full" 
            style={{ width: `${percentage}%` }} 
          />
        </div>
      </div>
    </div>
  )
}

function ReferrerItem({ domain, visits }: { domain: string; visits: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">{domain}</span>
      <span className="text-sm text-muted-foreground">{visits} visits</span>
    </div>
  )
}

function SearchTermItem({ term, visits }: { term: string; visits: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">{term}</span>
      <span className="text-sm text-muted-foreground">{visits}</span>
    </div>
  )
}

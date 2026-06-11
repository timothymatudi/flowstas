import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Check, AlertCircle } from 'lucide-react'
import { PRODUCTS } from '@/lib/products'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .single()

  const currentPlan = subscription
    ? PRODUCTS.find(p => p.id === subscription.plan) || PRODUCTS[0]
    : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </div>
            {subscription && (
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {subscription.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {subscription && currentPlan ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{currentPlan.name}</h3>
                  <p className="text-muted-foreground">{currentPlan.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    £{(currentPlan.priceInCents / 100).toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">/{currentPlan.interval}</span>
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-3">Plan includes:</p>
                <ul className="space-y-2">
                  {currentPlan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {subscription.current_period_end && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No active subscription</h3>
              <p className="text-muted-foreground mb-4">
                You&apos;re currently on the free plan. Upgrade to access premium features.
              </p>
              <Button asChild>
                <Link href="/pricing">View Plans</Link>
              </Button>
            </div>
          )}
        </CardContent>
        {subscription && (
          <CardFooter className="border-t pt-6">
            <Button variant="outline" asChild>
              <Link href="/pricing">Change Plan</Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

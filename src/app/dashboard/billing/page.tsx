import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Download, 
  Check,
  AlertCircle
} from 'lucide-react'
import { PRODUCTS } from '@/lib/products'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Fetch subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const currentPlan = subscription 
    ? PRODUCTS.find(p => p.id === subscription.plan) || PRODUCTS[0]
    : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and payment methods.
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
          {currentPlan && subscription ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{currentPlan.name}</h3>
                  <p className="text-muted-foreground">{currentPlan.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    ${(currentPlan.priceInCents / 100).toFixed(2)}
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
              <p className="text-muted-foreground mb-4">
                You don&apos;t have an active subscription yet.
              </p>
              <Button asChild>
                <Link href="/pricing">Choose a Plan</Link>
              </Button>
            </div>
          )}
        </CardContent>
        {currentPlan && subscription && (
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" asChild>
              <Link href="/pricing">Change Plan</Link>
            </Button>
            <Button variant="ghost" className="text-destructive hover:text-destructive">
              Cancel Subscription
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment details</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription?.stripe_customer_id ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">VISA</span>
                </div>
                <div>
                  <p className="font-medium">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/2028</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Update</Button>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No payment method on file</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <InvoiceItem
                date="April 1, 2026"
                amount={`$${((currentPlan?.priceInCents || 0) / 100).toFixed(2)}`}
                status="Paid"
                plan={currentPlan?.name || 'Unknown'}
              />
              <InvoiceItem
                date="March 1, 2026"
                amount={`$${((currentPlan?.priceInCents || 0) / 100).toFixed(2)}`}
                status="Paid"
                plan={currentPlan?.name || 'Unknown'}
              />
              <InvoiceItem
                date="February 1, 2026"
                amount={`$${((currentPlan?.priceInCents || 0) / 100).toFixed(2)}`}
                status="Paid"
                plan={currentPlan?.name || 'Unknown'}
              />
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No billing history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InvoiceItem({
  date,
  amount,
  status,
  plan,
}: {
  date: string
  amount: string
  status: string
  plan: string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{plan}</p>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-medium">{amount}</p>
          <Badge variant="secondary" className="text-xs">{status}</Badge>
        </div>
        <Button variant="ghost" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

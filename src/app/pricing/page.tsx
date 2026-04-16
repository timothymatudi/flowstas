import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, ArrowLeft, Zap } from 'lucide-react'
import { PRODUCTS } from '@/lib/products'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get current subscription if logged in
  let currentPlan: string | null = null
  if (user) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
    currentPlan = subscription?.plan || null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Flowstas
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-foreground transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/sign-up">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Zap className="h-3 w-3 mr-1" />
            Simple, transparent pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose the right plan for you
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include a 14-day free trial with no credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {PRODUCTS.map((product) => {
            const isCurrentPlan = currentPlan === product.id
            const isPopular = product.id === 'pro'
            const price = (product.priceInCents / 100).toFixed(2)

            return (
              <Card 
                key={product.id} 
                className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary">Current Plan</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-muted-foreground">/{product.interval}</span>
                  </div>
                  <ul className="space-y-3">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrentPlan ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : user ? (
                    <Button 
                      className="w-full" 
                      variant={isPopular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href={`/checkout/${product.id}`}>
                        {currentPlan ? 'Switch to this plan' : 'Start Free Trial'}
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={isPopular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href="/auth/sign-up">Get Started</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-24">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <FAQItem
              question="Can I cancel my subscription anytime?"
              answer="Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
            />
            <FAQItem
              question="What happens after my free trial?"
              answer="After your 14-day free trial ends, you'll be automatically charged for your selected plan unless you cancel before the trial ends."
            />
            <FAQItem
              question="Can I change my plan later?"
              answer="Absolutely! You can upgrade or downgrade your plan at any time from your dashboard. Changes take effect immediately."
            />
            <FAQItem
              question="Do you offer refunds?"
              answer="We offer a full refund within the first 30 days if you're not satisfied with our service. No questions asked."
            />
            <FAQItem
              question="Is there a discount for annual billing?"
              answer="Yes! When you choose annual billing, you get 2 months free compared to monthly billing."
            />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-24">
          <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
          <p className="text-muted-foreground mb-6">
            Our team is here to help. Reach out anytime.
          </p>
          <Button variant="outline" size="lg">
            Contact Sales
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Flowstas. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b pb-6">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  )
}

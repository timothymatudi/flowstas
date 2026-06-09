'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import PricingCards from '@/components/pricing-cards'
import Checkout from '@/components/checkout'

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 pb-16 pt-24 lg:pb-24 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent via-background to-background" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Choose the perfect plan for your needs. Start with a 1-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards or Checkout */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          {selectedPlan ? (
            <div className="mx-auto max-w-2xl">
              <button
                onClick={() => setSelectedPlan(null)}
                className="mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <span>&larr;</span>
                Back to plans
              </button>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-premium-lg">
                <Checkout productId={selectedPlan} />
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl">
              <PricingCards onSelectPlan={setSelectedPlan} />
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-t border-border/40 bg-card py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              All Plans Include
            </h2>
            <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
              {[
                '1-day free trial',
                'No setup fees',
                'Secure payments via Stripe',
                'Responsive email support',
                'Private, secure workspace',
                'Regular product updates',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-4 shadow-premium">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                    <Check className="h-3.5 w-3.5 text-foreground" />
                  </div>
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PricingCards from '@/components/pricing-cards'
import Checkout from '@/components/checkout'

export default function Page() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {!selectedPlan ? (
          <>
            <div className="mb-12 text-center">
              <h1 className="mb-4 text-4xl font-bold tracking-tight">
                Choose Your Plan
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Select the perfect subscription plan for your needs. All plans include a 14-day free trial.
              </p>
            </div>
            <PricingCards onSelectPlan={setSelectedPlan} />
          </>
        ) : (
          <div className="mx-auto max-w-2xl">
            <Button
              variant="ghost"
              onClick={() => setSelectedPlan(null)}
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to plans
            </Button>
            <h2 className="mb-6 text-2xl font-bold">Complete Your Subscription</h2>
            <Checkout productId={selectedPlan} />
          </div>
        )}
      </div>
    </main>
  )
}

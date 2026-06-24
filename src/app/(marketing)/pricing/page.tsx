'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import PricingCards from '@/components/pricing-cards'
import Checkout from '@/components/checkout'

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const t = useTranslations('pricing')

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 pb-16 pt-24 lg:pb-24 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent via-background to-background" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block mb-4 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold uppercase tracking-wider text-primary">
              {t('eyebrow')}
            </span>
            <h1 className="font-display text-balance text-5xl tracking-tight md:text-6xl lg:text-7xl leading-[0.98] gradient-text">
              {t('title')}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              {t('subtitle')}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2.5 text-sm text-muted-foreground">
              {[t('badge1'), t('badge2'), t('badge3')].map((label) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-600" /> {label}
                </span>
              ))}
            </div>
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
                {t('backToPlans')}
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
              {t('includesTitle')}
            </h2>
            <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
              {[
                t('inc1'),
                t('inc2'),
                t('inc3'),
                t('inc4'),
                t('inc5'),
                t('inc6'),
              ].map((item) => (
                <div key={item} className="card-hover flex items-center gap-3 rounded-xl border border-border/60 bg-background p-4 shadow-premium">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing questions */}
      <section className="border-t border-border/40 py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {t('faqTitle')}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t('faqSubtitle')}
              </p>
            </div>
            <div className="mt-10 grid gap-4">
              {[
                { q: t('q1'), a: t('a1') },
                { q: t('q2'), a: t('a2') },
                { q: t('q3'), a: t('a3') },
              ].map(({ q, a }) => (
                <div key={q} className="glass-light rounded-2xl p-6 shadow-premium">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {q}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

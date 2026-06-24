'use client'

import { Check, Sparkles, ArrowRight } from 'lucide-react'
import { PRODUCTS, type SubscriptionProduct } from '@/lib/products'
import { useCurrency } from '@/components/currency-provider'
import { formatMoney } from '@/lib/currency'

interface PricingCardsProps {
  onSelectPlan: (productId: string) => void
}

export default function PricingCards({ onSelectPlan }: PricingCardsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PRODUCTS.map((product) => (
        <PricingCard
          key={product.id}
          product={product}
          onSelect={() => onSelectPlan(product.id)}
          isPopular={product.id === 'pro'}
        />
      ))}
    </div>
  )
}

function PricingCard({
  product,
  onSelect,
  isPopular,
}: {
  product: SubscriptionProduct
  onSelect: () => void
  isPopular?: boolean
}) {
  // Show the price in the visitor's chosen currency (converted from the GBP
  // base). The actual charge uses the same currency at checkout.
  const { currency } = useCurrency()
  const price = formatMoney(product.priceInCents, currency)

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 card-hover ${
        isPopular
          ? 'glass-light border border-primary/30 glow'
          : 'glass-light'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
            <Sparkles className="h-3.5 w-3.5" />
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground">{product.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold tracking-tight gradient-text">{price}</span>
          <span className="text-muted-foreground">/{product.interval}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Billed {product.interval}ly. Cancel anytime.</p>
      </div>

      <ul className="mb-8 flex-1 space-y-4">
        {product.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isPopular ? 'bg-primary/20' : 'bg-secondary'}`}>
              <Check className={`h-3 w-3 ${isPopular ? 'text-primary' : 'text-foreground'}`} />
            </div>
            <span className="text-sm text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full rounded-xl py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          isPopular
            ? 'btn-primary'
            : 'btn-secondary'
        }`}
      >
        {isPopular ? 'Get Started' : 'Choose Plan'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

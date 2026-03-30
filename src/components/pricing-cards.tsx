'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PRODUCTS, type SubscriptionProduct } from '@/lib/products'

interface PricingCardsProps {
  onSelectPlan: (productId: string) => void
}

export default function PricingCards({ onSelectPlan }: PricingCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
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
  const price = (product.priceInCents / 100).toFixed(2)

  return (
    <Card className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            Most Popular
          </span>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{product.name}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-6 text-center">
          <span className="text-4xl font-bold">${price}</span>
          <span className="text-muted-foreground">/{product.interval}</span>
        </div>
        <ul className="space-y-3">
          {product.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onSelect}
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
        >
          Subscribe
        </Button>
      </CardFooter>
    </Card>
  )
}

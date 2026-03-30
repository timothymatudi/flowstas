export interface SubscriptionProduct {
  id: string
  name: string
  description: string
  priceInCents: number
  interval: 'month' | 'year'
  features: string[]
}

// This is the source of truth for all subscription products.
// All UI to display products should pull from this array.
// IDs passed to the checkout session should be the same as IDs from this array.
export const PRODUCTS: SubscriptionProduct[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    description: 'Perfect for getting started',
    priceInCents: 999, // $9.99/month
    interval: 'month',
    features: [
      'Core features',
      'Email support',
      'Up to 1,000 requests/month',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    description: 'Best for growing businesses',
    priceInCents: 2999, // $29.99/month
    interval: 'month',
    features: [
      'Everything in Basic',
      'Priority support',
      'Up to 10,000 requests/month',
      'Advanced analytics',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    description: 'For large scale operations',
    priceInCents: 9999, // $99.99/month
    interval: 'month',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Unlimited requests',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
]

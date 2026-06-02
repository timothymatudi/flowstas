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
    name: 'Starter',
    description: 'Perfect for individuals and small teams getting started',
    priceInCents: 999, // $9.99/month
    interval: 'month',
    features: [
      'Up to 5 team members',
      '1,000 requests per month',
      'Basic analytics dashboard',
      'Email support',
      'Standard integrations',
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'Best for growing businesses that need more power',
    priceInCents: 2999, // $29.99/month
    interval: 'month',
    features: [
      'Up to 25 team members',
      '25,000 requests per month',
      'Advanced analytics & reports',
      'Priority support (24hr response)',
      'All integrations included',
      'Custom workflows',
      'API access',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom requirements',
    priceInCents: 9999, // $99.99/month
    interval: 'month',
    features: [
      'Unlimited team members',
      'Unlimited requests',
      'Real-time analytics',
      'Dedicated account manager',
      'Custom integrations',
      'SSO & advanced security',
      'SLA guarantee (99.99% uptime)',
      'On-premise deployment option',
    ],
  },
]

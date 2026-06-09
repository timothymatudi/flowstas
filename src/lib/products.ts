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
    description: 'Everything one person needs to organize their work',
    priceInCents: 999, // $9.99/month
    interval: 'month',
    features: [
      'Kanban board + list view',
      'Unlimited tasks',
      'Three priority levels',
      'Drag-and-drop organization',
      'Private, secure workspace',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'For power users who want faster help and early access',
    priceInCents: 2999, // $29.99/month
    interval: 'month',
    features: [
      'Everything in Starter',
      'Priority email support',
      'Early access to new features',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Hands-on support and a direct line to the team',
    priceInCents: 9999, // $99.99/month
    interval: 'month',
    features: [
      'Everything in Professional',
      'Dedicated support contact',
      'Personal onboarding session',
      'Priority feature requests',
      'Invoiced billing',
    ],
  },
]

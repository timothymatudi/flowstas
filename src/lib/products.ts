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
    description: 'Everything you need to put one site online',
    priceInCents: 1000, // £10/month (amount is in pence; currency GBP)
    interval: 'month',
    features: [
      'Publish 1 website',
      'Paste HTML or upload a zip / folder',
      'Live instantly with HTTPS',
      'Contact-form message capture',
      'Messages inbox in your dashboard',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'For freelancers and small teams running several sites',
    priceInCents: 3000, // £30/month
    interval: 'month',
    features: [
      'Everything in Starter',
      'Publish up to 10 websites',
      'Priority email support',
      'Early access to new features',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Hands-on support and a direct line to the team',
    priceInCents: 10000, // £100/month
    interval: 'month',
    features: [
      'Everything in Professional',
      'Unlimited websites',
      'Dedicated support contact',
      'Personal onboarding session',
      'Invoiced billing',
    ],
  },
]

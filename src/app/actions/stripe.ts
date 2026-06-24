'use server'

import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { PRODUCTS } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_CURRENCY, isCurrency, toMinorUnits } from '@/lib/currency'

export async function startCheckoutSession(productId: string, currencyCode?: string) {
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  // Charge in the visitor's currency (converted from the GBP base price). Stripe
  // accepts any currency via ad-hoc price_data, so no per-currency Price IDs are
  // needed.
  const currency = currencyCode && isCurrency(currencyCode) ? currencyCode : DEFAULT_CURRENCY
  const unitAmount = toMinorUnits(product.priceInCents, currency)

  // Attach the signed-in user so the Stripe webhook can link the resulting
  // subscription back to their account.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const headersList = await headers()
  const origin = headersList.get('origin') || 'http://localhost:3000'

  // Create Checkout Sessions for subscription
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    return_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    // Carry the chosen plan (and user) on the session so the Stripe webhook can
    // record the correct plan — ad-hoc price_data prices have no nickname to read.
    metadata: {
      plan: product.id,
      currency,
      ...(user ? { user_id: user.id } : {}),
    },
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: unitAmount,
          recurring: {
            interval: product.interval,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
  })

  return session.client_secret
}

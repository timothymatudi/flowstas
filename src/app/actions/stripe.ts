'use server'

import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { PRODUCTS } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'

export async function startCheckoutSession(productId: string) {
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

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
    ...(user ? { metadata: { user_id: user.id } } : {}),
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
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

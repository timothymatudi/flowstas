import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  if (event.type === 'checkout.session.completed') {
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string
    const userId = session.metadata?.user_id

    if (!userId) return NextResponse.json({ received: true })

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const productName = subscription.items.data[0]?.price?.nickname || 'basic'
    const plan = productName.toLowerCase().replace(' plan', '')

    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan,
      status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    await supabase
      .from('subscriptions')
      .update({
        status: sub.status === 'active' ? 'active' : 'canceled',
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}

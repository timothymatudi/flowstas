import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Service-role client: bypasses RLS so the webhook can write subscriptions.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// In Stripe API 2025+ the billing period moved onto subscription items.
function periodFor(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0]
  return {
    start: new Date(item.current_period_start * 1000).toISOString(),
    end: new Date(item.current_period_end * 1000).toISOString(),
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string
    const userId = session.metadata?.user_id

    if (!userId || !subscriptionId) {
      return NextResponse.json({ received: true })
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const nickname = subscription.items.data[0]?.price?.nickname || 'basic'
    const plan = nickname.toLowerCase().replace(' plan', '')
    const period = periodFor(subscription)

    await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        plan,
        status: 'active',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        current_period_start: period.start,
        current_period_end: period.end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object
    const period = periodFor(sub)
    await supabase
      .from('subscriptions')
      .update({
        status: sub.status === 'active' ? 'active' : 'canceled',
        current_period_start: period.start,
        current_period_end: period.end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}

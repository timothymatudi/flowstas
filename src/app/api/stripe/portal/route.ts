import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// Opens the Stripe Customer Portal so a paying user can update their card,
// download invoices, or cancel their subscription. The portal handles all of
// that UI; our webhook keeps the subscriptions row in sync afterwards.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  const customerId = subscription?.stripe_customer_id
  const origin = req.nextUrl.origin

  if (!customerId) {
    // No Stripe customer on file (free user, or never completed checkout).
    return NextResponse.redirect(new URL('/dashboard/billing', origin), { status: 303 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard/billing`,
  })

  return NextResponse.redirect(session.url, { status: 303 })
}

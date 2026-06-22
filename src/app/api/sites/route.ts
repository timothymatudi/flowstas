import { NextResponse } from 'next/server'
import { createSite, countSitesForOwner } from '@/lib/site-store'
import { createClient } from '@/lib/supabase/server'
import { siteLimitForPlan, effectivePlan } from '@/lib/plan-limits'
import { parseUpload } from '@/lib/upload-parse'

export const dynamic = 'force-dynamic'

// Publish a new site from a pasted page, a folder, or a .zip.
export async function POST(req: Request) {
  // Publishing requires an account, and each plan caps how many sites you can
  // have. Published sites stay public to view — this only gates creating them.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Please log in to publish your site.', needsAuth: true },
      { status: 401 }
    )
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, trial_ends_at')
    .eq('user_id', user.id)
    .maybeSingle()
  const limit = siteLimitForPlan(effectivePlan(sub))
  if ((await countSitesForOwner(user.id)) >= limit) {
    return NextResponse.json(
      {
        error: `You've reached your plan's limit of ${limit} site${limit === 1 ? '' : 's'}. Upgrade your plan to publish more.`,
        needsUpgrade: true,
      },
      { status: 403 }
    )
  }

  const parsed = await parseUpload(req)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  try {
    const meta = await createSite(parsed.name, parsed.files, user.id)
    return NextResponse.json({
      id: meta.id,
      subdomain: meta.subdomain,
      url: `https://${meta.subdomain}.flowstas.com`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not publish your site.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

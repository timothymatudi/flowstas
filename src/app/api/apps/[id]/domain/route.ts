import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApp, setAppCustomDomain } from '@/lib/app-store'
import { appDomain, workerConfigured } from '@/lib/build-worker'

export const dynamic = 'force-dynamic'

// A hostname like app.yourbusiness.com: one or more labels of letters/digits/
// hyphens (no leading/trailing hyphen), at least one dot.
const HOST_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i

// POST /api/apps/[id]/domain — connect a custom domain to the owner's app.
// The worker attaches the domain to the app and returns branded A/AAAA IPs for
// the customer to point their domain at (the underlying host stays hidden).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  const { id } = await params
  const app = await getApp(id, user.id)
  if (!app) return NextResponse.json({ error: 'App not found.' }, { status: 404 })

  if (!workerConfigured()) {
    return NextResponse.json(
      { error: 'The build worker isn’t configured yet, so domains can’t be connected.' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const raw = (body as { domain?: unknown })?.domain
  const domain = typeof raw === 'string' ? raw.trim() : ''
  if (!HOST_RE.test(domain)) {
    return NextResponse.json(
      { error: 'Enter a valid domain, like app.yourbusiness.com.' },
      { status: 400 },
    )
  }

  const result = await appDomain(app.flyApp, 'add', domain)
  await setAppCustomDomain(app.id, user.id, domain.toLowerCase())

  return NextResponse.json({ ok: true, domain: domain.toLowerCase(), a: result.a, aaaa: result.aaaa })
}

// DELETE /api/apps/[id]/domain — disconnect the app's custom domain.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  const { id } = await params
  const app = await getApp(id, user.id)
  if (!app) return NextResponse.json({ error: 'App not found.' }, { status: 404 })

  if (app.customDomain) {
    // Best-effort detach on the worker — even if it fails, we clear our record
    // so the customer can move on (the dangling domain can be cleaned up later).
    try {
      await appDomain(app.flyApp, 'remove', app.customDomain)
    } catch {
      // ignore — still clear it below
    }
  }

  await setAppCustomDomain(app.id, user.id, null)
  return NextResponse.json({ ok: true })
}

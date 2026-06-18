import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApp, setAppStatus, deleteApp } from '@/lib/app-store'
import { appLifecycle, workerConfigured } from '@/lib/build-worker'

export const dynamic = 'force-dynamic'

const ACTIONS = ['stop', 'start', 'restart'] as const
type Action = (typeof ACTIONS)[number]

// Lifecycle controls for a deployed compute app: stop / start / restart the
// underlying Fly app (PATCH), or delete it entirely (DELETE).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  const { id } = await params
  const app = await getApp(id, user.id)
  if (!app) return NextResponse.json({ error: 'App not found.' }, { status: 404 })

  if (!workerConfigured())
    return NextResponse.json({ error: 'Compute is not configured yet.' }, { status: 503 })

  const body = (await req.json().catch(() => ({}))) as { action?: string }
  const action = body.action as Action
  if (!ACTIONS.includes(action))
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })

  try {
    await appLifecycle(app.flyApp, action)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not update the app.' },
      { status: 502 }
    )
  }

  const status = action === 'stop' ? 'stopped' : 'live'
  await setAppStatus(app.id, user.id, status)
  return NextResponse.json({ ok: true, status })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  const { id } = await params
  const app = await getApp(id, user.id)
  if (!app) return NextResponse.json({ error: 'App not found.' }, { status: 404 })

  // Best-effort: stop the Fly app to free resources before removing the record.
  try {
    await appLifecycle(app.flyApp, 'stop')
  } catch {
    // Ignore — we delete the record regardless of whether the stop succeeds.
  }

  await deleteApp(app.id, user.id)
  return NextResponse.json({ ok: true })
}

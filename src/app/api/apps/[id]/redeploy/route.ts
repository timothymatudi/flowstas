import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApp, setAppStatus, updateAppDeploy } from '@/lib/app-store'
import { startDeploy, parseResult, workerConfigured } from '@/lib/build-worker'

export const dynamic = 'force-dynamic'
// A rebuild is a full build; allow the longest the platform permits.
export const maxDuration = 300

// POST /api/apps/[id]/redeploy — rebuild an existing app from its tracked repo
// and branch. Used to retry a failed build or pull in changes manually (the
// GitHub webhook does this automatically on push). Unlike the initial /deploy,
// this doesn't stream: it runs the worker to completion and records the outcome,
// so the dashboard can simply refresh to show the new status.
//
// Note: a private repo's access token is never stored, so a redeploy can only
// re-clone repos the worker can already reach. The worker keeps the app's saved
// secrets, so those carry over.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  const { id } = await params
  const app = await getApp(id, user.id)
  if (!app) return NextResponse.json({ error: 'App not found.' }, { status: 404 })

  if (!workerConfigured())
    return NextResponse.json({ error: 'App hosting is not configured yet.' }, { status: 503 })

  if (app.status === 'building')
    return NextResponse.json(
      { error: 'A build is already in progress for this app.' },
      { status: 409 }
    )

  // Mark it building so the dashboard reflects the rebuild immediately.
  await setAppStatus(app.id, user.id, 'building')

  let res: Response
  try {
    res = await startDeploy({ repo: app.repo, name: app.flyApp, branch: app.branch })
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Could not start the rebuild.'
    await updateAppDeploy(app.id, { ok: false, error }, error)
    return NextResponse.json({ error }, { status: 502 })
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '')
    const error = `Build worker error (${res.status}). ${text}`.trim()
    await updateAppDeploy(app.id, { ok: false, error }, error)
    return NextResponse.json({ error }, { status: 502 })
  }

  // Run to completion, capturing the log so we can record the outcome and keep
  // it available for the dashboard / AI assistant.
  const logs = await res.text()
  const result = parseResult(logs) ?? {
    ok: false as const,
    error: 'Build ended without a result.',
  }
  await updateAppDeploy(app.id, result, logs)

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 200 })
  return NextResponse.json({ ok: true, url: result.url })
}

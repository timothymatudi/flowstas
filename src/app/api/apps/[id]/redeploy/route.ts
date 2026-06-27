import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApp, setAppStatus, updateAppDeploy, getAppGithubToken, setAppGithubToken } from '@/lib/app-store'
import { startDeploy, parseResult, workerConfigured } from '@/lib/build-worker'
import { resolveCloneToken } from '@/lib/github-connection'

export const dynamic = 'force-dynamic'
// A rebuild is a full build; allow the longest the platform permits.
export const maxDuration = 300

// POST /api/apps/[id]/redeploy — rebuild an existing app from its tracked repo
// and branch. Used to retry a failed build or pull in changes manually (the
// GitHub webhook does this automatically on push). Unlike the initial /deploy,
// this doesn't stream: it runs the worker to completion and records the outcome,
// so the dashboard can simply refresh to show the new status.
//
// Note: a private repo's clone token, if supplied at create time, is stored
// encrypted (AES-256-GCM, key in APP_TOKEN_ENC_KEY) and re-supplied here so the
// redeploy can re-clone. The worker also keeps the app's saved secrets.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  const { id } = await params
  const app = await getApp(id, user.id)
  if (!app) return NextResponse.json({ error: 'App not found.' }, { status: 404 })

  // Optional: a fresh clone token for a private repo. Lets the user supply (or
  // update) credentials when none were stored at create time or the old token
  // expired — without having to recreate the app. Empty/absent = use the stored
  // one. Body is optional, so tolerate a missing/invalid JSON body.
  let newToken: string | null = null
  try {
    const body = (await req.json().catch(() => null)) as { githubToken?: unknown } | null
    const raw = typeof body?.githubToken === 'string' ? body.githubToken.trim() : ''
    if (raw) {
      if (!/^[A-Za-z0-9_]{20,300}$/.test(raw))
        return NextResponse.json(
          { error: 'That doesn’t look like a valid GitHub access token.' },
          { status: 400 }
        )
      newToken = raw
    }
  } catch {
    // no body — fall back to the stored token
  }

  if (!workerConfigured())
    return NextResponse.json({ error: 'App hosting is not configured yet.' }, { status: 503 })

  if (app.status === 'building')
    return NextResponse.json(
      { error: 'A build is already in progress for this app.' },
      { status: 409 }
    )

  // Mark it building so the dashboard reflects the rebuild immediately.
  await setAppStatus(app.id, user.id, 'building')

  // If the user supplied a fresh token, persist it (encrypted) so it sticks for
  // future push-triggered rebuilds too; otherwise re-use the stored one.
  if (newToken) {
    try {
      await setAppGithubToken(app.id, user.id, newToken)
    } catch {
      // best-effort persistence; the live deploy below still uses newToken
    }
  }
  // Token to clone with, in order: a freshly supplied one, the app's stored clone
  // token, then the user's connected GitHub account (github.com repos only). So a
  // connected user can redeploy a private repo with nothing extra to enter.
  const githubToken =
    newToken ??
    (await getAppGithubToken(app.id)) ??
    (await resolveCloneToken(user.id, app.repo, null))

  let res: Response
  try {
    res = await startDeploy({
      repo: app.repo,
      name: app.flyApp,
      branch: app.branch,
      buildEnv: app.buildEnv,
      githubToken,
    })
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

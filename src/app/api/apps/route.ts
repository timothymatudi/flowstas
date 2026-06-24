import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { appLimitForPlan, effectivePlan } from '@/lib/plan-limits'
import { createApp, countAppsForOwner, updateAppDeploy, listApps, setAppGithubToken } from '@/lib/app-store'
import { startDeploy, parseResult, workerConfigured } from '@/lib/build-worker'

export const dynamic = 'force-dynamic'
// Builds can take a few minutes; allow the longest the platform permits.
export const maxDuration = 300

// GitHub, GitLab, or Bitbucket repo URL (with or without a trailing .git).
const VALID_REPO = /^https:\/\/(?:github\.com|gitlab\.com|bitbucket\.org)\/[\w.-]+\/[\w.-]+(?:\.git)?\/?$/

// List the signed-in user's apps.
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
  return NextResponse.json({ apps: await listApps(user.id) })
}

// Deploy a new app from a public GitHub repo. Streams build logs back as plain
// text; the final line is "FLOWSTAS_RESULT {json}" carrying the live URL or error.
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Please log in to deploy an app.', needsAuth: true },
      { status: 401 }
    )
  }

  if (!workerConfigured()) {
    return NextResponse.json(
      { error: 'App hosting is not configured yet. Please try again later.' },
      { status: 503 }
    )
  }

  let body: { name?: string; repo?: string; branch?: string; githubToken?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const repo = (body.repo || '').trim()
  const name = (body.name || '').trim()
  const branch = (body.branch || '').trim() || null
  // For private repos the user supplies a GitHub token. We pass it straight to
  // the worker for the clone and never store it.
  const githubToken = (body.githubToken || '').trim() || null
  if (!VALID_REPO.test(repo)) {
    return NextResponse.json(
      { error: 'Paste a GitHub, GitLab, or Bitbucket repo link, e.g. https://github.com/you/your-app.' },
      { status: 400 }
    )
  }
  if (githubToken && !/^[A-Za-z0-9_]{20,300}$/.test(githubToken)) {
    return NextResponse.json(
      { error: 'That doesn’t look like a valid GitHub access token.' },
      { status: 400 }
    )
  }

  // Each plan caps how many running apps you can have.
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, trial_ends_at')
    .eq('user_id', user.id)
    .maybeSingle()
  const limit = appLimitForPlan(effectivePlan(sub))
  if ((await countAppsForOwner(user.id)) >= limit) {
    return NextResponse.json(
      {
        error: `You've reached your plan's limit of ${limit} app${limit === 1 ? '' : 's'}. Upgrade to deploy more.`,
        needsUpgrade: true,
      },
      { status: 403 }
    )
  }

  // Record the app (status "building"), then kick off the worker.
  const app = await createApp(name || repo.split('/').pop() || 'app', repo, branch, user.id)

  // For a private repo, persist the clone token (encrypted) so future redeploys
  // and push-triggered builds can re-clone without re-prompting. Best-effort:
  // never block the deploy if APP_TOKEN_ENC_KEY isn't configured.
  if (githubToken) {
    try {
      await setAppGithubToken(app.id, user.id, githubToken)
    } catch {
      // token simply won't be stored; initial deploy still uses it live below
    }
  }

  let workerRes: Response
  try {
    workerRes = await startDeploy({ repo, name: app.flyApp, branch, githubToken, buildEnv: app.buildEnv })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not start the build.'
    await updateAppDeploy(app.id, { ok: false, error: message }, message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
  if (!workerRes.ok || !workerRes.body) {
    const text = await workerRes.text().catch(() => '')
    const message = `Build worker error (${workerRes.status}). ${text}`.trim()
    await updateAppDeploy(app.id, { ok: false, error: message }, message)
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // Stream the worker's log output to the browser while capturing the full text,
  // so we can record the outcome (url/error) when the build finishes.
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let captured = ''
  const reader = workerRes.body.getReader()

  const stream = new ReadableStream({
    start(controller) {
      // First line carries the app id so the browser can link to it.
      controller.enqueue(encoder.encode(`FLOWSTAS_APP ${app.id}\n`))
    },
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        const result = parseResult(captured) ?? {
          ok: false as const,
          error: 'Build ended without a result.',
        }
        await updateAppDeploy(app.id, result, captured)
        controller.close()
        return
      }
      captured += decoder.decode(value, { stream: true })
      controller.enqueue(value)
    },
    cancel() {
      reader.cancel().catch(() => {})
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}

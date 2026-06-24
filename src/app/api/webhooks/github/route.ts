import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { listAppsByRepo, updateAppDeploy, getAppGithubToken } from '@/lib/app-store'
import { startDeploy, parseResult } from '@/lib/build-worker'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Auto-redeploy: GitHub calls this on every push. We verify the HMAC signature,
// find the Flowstas apps tracking that repo, and rebuild each one via the worker.
export async function POST(req: NextRequest) {
  // Read the raw bytes BEFORE parsing — signature is computed over them.
  const raw = await req.text()

  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Auto-deploy is not configured.' }, { status: 503 })
  }

  const signature = req.headers.get('x-hub-signature-256') ?? ''
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex')
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (req.headers.get('x-github-event') !== 'push') {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const payload = JSON.parse(raw)
  const url: string | undefined =
    payload.repository?.html_url ?? payload.repository?.clone_url
  if (!url) {
    return NextResponse.json({ ok: true, redeployed: 0 })
  }

  // The branch that was pushed, e.g. "refs/heads/main" -> "main".
  const pushedBranch =
    typeof payload.ref === 'string' && payload.ref.startsWith('refs/heads/')
      ? payload.ref.slice('refs/heads/'.length)
      : null
  const defaultBranch: string | undefined = payload.repository?.default_branch

  const apps = await listAppsByRepo(url)
  let redeployed = 0

  for (const app of apps) {
    // Only redeploy when the push is to the branch this app tracks (apps with no
    // explicit branch follow the repo's default), so a feature-branch push
    // doesn't trigger a production rebuild.
    const tracked = app.branch ?? defaultBranch
    if (pushedBranch && tracked && pushedBranch !== tracked) continue

    try {
      const githubToken = await getAppGithubToken(app.id)
      const res = await startDeploy({
        repo: app.repo,
        name: app.flyApp,
        branch: app.branch,
        buildEnv: app.buildEnv,
        githubToken,
      })
      if (!res.ok || !res.body) {
        await updateAppDeploy(app.id, { ok: false, error: `worker ${res.status}` }, '')
        continue
      }
      const fullText = await res.text()
      await updateAppDeploy(
        app.id,
        parseResult(fullText) ?? { ok: false, error: 'Build ended without a result.' },
        fullText
      )
      redeployed++
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Redeploy failed.'
      try {
        await updateAppDeploy(app.id, { ok: false, error }, '')
      } catch {
        // Swallow store errors so one bad app doesn't abort the rest.
      }
    }
  }

  return NextResponse.json({ ok: true, redeployed })
}

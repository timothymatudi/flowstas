import 'server-only'

// Client for the Flowstas build worker (scripts/build-worker/server.mjs), the
// always-on Fly machine that builds + deploys customer apps. The website can't
// run the deploy engine itself (no flyctl, no long builds in a serverless
// function), so it calls this worker over HTTP.
//
// Env (set in the website's environment):
//   FLOWSTAS_WORKER_URL   e.g. https://flowstas-build-worker.fly.dev
//   WORKER_TOKEN          shared secret the worker checks

export function workerConfigured(): boolean {
  return Boolean(process.env.FLOWSTAS_WORKER_URL && process.env.WORKER_TOKEN)
}

// The worker streams plain-text build logs, then ends with a final line:
//   FLOWSTAS_RESULT {"ok":true,"url":"..."}  | {"ok":false,"error":"..."}
export type DeployResult = { ok: true; url: string } | { ok: false; error: string }

const RESULT_PREFIX = 'FLOWSTAS_RESULT '

// Parse the worker's trailing result line out of the full captured log text.
export function parseResult(logs: string): DeployResult | null {
  const idx = logs.lastIndexOf(RESULT_PREFIX)
  if (idx === -1) return null
  try {
    return JSON.parse(logs.slice(idx + RESULT_PREFIX.length).trim())
  } catch {
    return null
  }
}

// Open a streaming deploy on the worker. Returns the raw Response so callers can
// pipe the body to the browser AND capture it; the body is a text stream of
// build logs ending in the FLOWSTAS_RESULT line.
export async function startDeploy(opts: {
  repo: string
  name: string
  branch?: string | null
  // GitHub access token for a private repo. Used by the worker for the clone
  // only; never persisted by Flowstas.
  githubToken?: string | null
  // Real build-time env to bake into the image. ONLY client-side PUBLIC values
  // (NEXT_PUBLIC_*, VITE_*, …) belong here — they get inlined into the browser
  // bundle at build time, so a placeholder would ship broken. Server secrets are
  // never sent here; they stay placeholders at build and are set as Fly secrets.
  buildEnv?: Record<string, string> | null
}): Promise<Response> {
  const base = process.env.FLOWSTAS_WORKER_URL
  const token = process.env.WORKER_TOKEN
  if (!base || !token) {
    throw new Error('Build worker is not configured (FLOWSTAS_WORKER_URL / WORKER_TOKEN).')
  }
  const hasBuildEnv = opts.buildEnv && Object.keys(opts.buildEnv).length > 0
  return fetch(`${base.replace(/\/$/, '')}/deploy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo: opts.repo,
      name: opts.name,
      ...(opts.branch ? { branch: opts.branch } : {}),
      ...(opts.githubToken ? { token: opts.githubToken } : {}),
      ...(hasBuildEnv ? { buildEnv: opts.buildEnv } : {}),
    }),
  })
}

// Generic JSON call to a non-streaming worker endpoint (/secrets, /lifecycle,
// /domain). Returns the parsed JSON; throws with the worker's message on failure.
// Feature routes (secrets, domain, lifecycle) use these so they never need to
// re-implement worker auth/transport.
export async function workerPost<T = Record<string, unknown>>(
  path: '/secrets' | '/lifecycle' | '/domain',
  body: Record<string, unknown>
): Promise<T> {
  const base = process.env.FLOWSTAS_WORKER_URL
  const token = process.env.WORKER_TOKEN
  if (!base || !token) throw new Error('Build worker is not configured.')
  const res = await fetch(`${base.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok || data.ok === false) {
    throw new Error((data.error as string) || `Worker error (${res.status}).`)
  }
  return data as T
}

// Set real env vars/secrets on an app (used by the secrets manager).
export function setAppSecrets(flyApp: string, secrets: Record<string, string>) {
  return workerPost<{ ok: true; count: number }>('/secrets', { name: flyApp, secrets })
}

// stop | start | restart an app (used by lifecycle controls).
export function appLifecycle(flyApp: string, action: 'stop' | 'start' | 'restart') {
  return workerPost<{ ok: true; action: string }>('/lifecycle', { name: flyApp, action })
}

// add | remove a custom domain on an app (used by the domain panel). On add the
// worker returns branded A/AAAA IPs to point the domain at (never a fly.dev host,
// so the underlying provider stays hidden from customers).
export function appDomain(flyApp: string, action: 'add' | 'remove', domain: string) {
  return workerPost<{ ok: true; domain: string; a?: string; aaaa?: string }>('/domain', {
    name: flyApp,
    action,
    domain,
  })
}

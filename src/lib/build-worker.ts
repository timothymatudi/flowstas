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
}): Promise<Response> {
  const base = process.env.FLOWSTAS_WORKER_URL
  const token = process.env.WORKER_TOKEN
  if (!base || !token) {
    throw new Error('Build worker is not configured (FLOWSTAS_WORKER_URL / WORKER_TOKEN).')
  }
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
    }),
  })
}

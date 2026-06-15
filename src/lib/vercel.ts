import 'server-only'

// Minimal Vercel API client for attaching a customer's custom domain to this
// project (so Vercel routes it here and issues an HTTPS cert). Needs
// VERCEL_API_TOKEN + VERCEL_PROJECT_ID (+ optional VERCEL_TEAM_ID) in env.

const API = 'https://api.vercel.com'

function cfg() {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID
  if (!token || !projectId) return null
  const q = teamId ? `?teamId=${teamId}` : ''
  return { token, projectId, q }
}

export type AddDomainResult =
  | { ok: true; verified: boolean }
  | { ok: false; error: string }

// Attach a domain to the Vercel project. Idempotent-ish: an already-added
// domain returns ok. Returns whether Vercel already considers it verified.
export async function addDomainToProject(domain: string): Promise<AddDomainResult> {
  const c = cfg()
  if (!c) return { ok: false, error: 'Custom domains are not configured yet.' }
  try {
    const res = await fetch(`${API}/v10/projects/${c.projectId}/domains${c.q}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domain }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) return { ok: true, verified: data?.verified !== false }
    // Already attached to this project is fine.
    if (data?.error?.code === 'domain_already_in_use' || res.status === 409) {
      return { ok: true, verified: false }
    }
    return { ok: false, error: data?.error?.message || `Vercel rejected the domain (${res.status}).` }
  } catch {
    return { ok: false, error: 'Could not reach Vercel to add the domain.' }
  }
}

export async function removeDomainFromProject(domain: string): Promise<void> {
  const c = cfg()
  if (!c) return
  await fetch(`${API}/v9/projects/${c.projectId}/domains/${domain}${c.q}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${c.token}` },
  }).catch(() => {})
}

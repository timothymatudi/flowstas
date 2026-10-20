import 'server-only'

// Fly.io GraphQL API for managing custom domain TLS certificates.
// Needs FLY_API_TOKEN + FLY_APP_NAME in env.

const GQL = 'https://api.fly.io/graphql'

function cfg() {
  const token = process.env.FLY_API_TOKEN
  const appName = process.env.FLY_APP_NAME
  if (!token || !appName) return null
  return { token, appName }
}

export type AddDomainResult =
  | { ok: true; verified: boolean }
  | { ok: false; error: string }

export async function addDomainToProject(domain: string): Promise<AddDomainResult> {
  const c = cfg()
  if (!c) return { ok: false, error: 'Custom domains are not configured yet.' }
  try {
    const res = await fetch(GQL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation AddCert($app: ID!, $host: String!) {
          addCertificate(appId: $app, hostname: $host) {
            certificate { id hostname configured }
          }
        }`,
        variables: { app: c.appName, host: domain },
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (data?.errors) {
      const msg: string = data.errors[0]?.message ?? ''
      // Already exists is fine
      if (msg.includes('already')) return { ok: true, verified: false }
      return { ok: false, error: msg || 'Fly.io rejected the domain.' }
    }
    const cert = data?.data?.addCertificate?.certificate
    return { ok: true, verified: Boolean(cert?.configured) }
  } catch {
    return { ok: false, error: 'Could not reach Fly.io to add the domain.' }
  }
}

export async function removeDomainFromProject(domain: string): Promise<void> {
  const c = cfg()
  if (!c) return
  await fetch(GQL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation DelCert($app: ID!, $host: String!) {
        deleteCertificate(appId: $app, hostname: $host) { certificate { id } }
      }`,
      variables: { app: c.appName, host: domain },
    }),
  }).catch(() => {})
}

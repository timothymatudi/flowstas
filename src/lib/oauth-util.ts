import 'server-only'

// Shared OAuth helpers used by every git-provider "Connect" flow (GitHub, GitLab,
// Bitbucket). Each provider module re-exports these so its routes can import
// everything from one place, exactly like the original GitHub implementation.

// The OAuth callback URL must EXACTLY match the one registered on the provider's
// app, and must stay stable across the apex/www split (flowstas.com redirects to
// www.flowstas.com). We canonicalize to the bare domain (strip a leading "www.")
// so a single registered callback — e.g. https://flowstas.com/api/<provider>/callback
// — works no matter which host the user is on. Both the authorize step and the
// token exchange must pass this identical value. `path` is the provider's own
// callback path (e.g. "/api/gitlab/callback").
export function canonicalCallbackUrl(origin: string, path: string): string {
  return `${origin.replace('://www.', '://')}${path}`
}

// Share the CSRF state cookie across apex + www, since the callback can land on a
// different host than the connect request after the apex→www redirect. Returns a
// cookie Domain for real flowstas.com hosts, or undefined (host-only) elsewhere
// (e.g. localhost) where a shared domain would be invalid.
export function stateCookieDomain(host: string): string | undefined {
  const h = host.split(':')[0]
  return h === 'flowstas.com' || h.endsWith('.flowstas.com') ? '.flowstas.com' : undefined
}

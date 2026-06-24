import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApp, setAppBuildEnv } from '@/lib/app-store'
import { setAppSecrets, appLifecycle, workerConfigured } from '@/lib/build-worker'

export const dynamic = 'force-dynamic'

const KEY_RE = /^[A-Z][A-Z0-9_]*$/

// Client-side PUBLIC env prefixes: frameworks inline these into the browser
// bundle at BUILD time, so the real value must be baked into the build (a Fly
// runtime secret can't reach the browser). These aren't secrets — they ship in
// the browser — so it's safe to persist them. Covers Next, Vite, SvelteKit/
// Astro, CRA, Gatsby, Expo, Nuxt and Vue CLI.
const PUBLIC_ENV_RE =
  /^(NEXT_PUBLIC_|VITE_|PUBLIC_|REACT_APP_|GATSBY_|EXPO_PUBLIC_|NUXT_PUBLIC_|VUE_APP_)/

// POST /api/apps/[id]/secrets — set env vars/secrets on the owner's Fly app.
// Secret values are written straight to Fly; we never persist them in our DB.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  const { id } = await params
  const app = await getApp(id, user.id)
  if (!app) return NextResponse.json({ error: 'App not found.' }, { status: 404 })

  if (!workerConfigured()) {
    return NextResponse.json(
      { error: 'The build worker isn’t configured yet, so secrets can’t be saved.' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const secrets = (body as { secrets?: unknown })?.secrets
  if (!secrets || typeof secrets !== 'object' || Array.isArray(secrets)) {
    return NextResponse.json({ error: 'Send a "secrets" object of KEY: value pairs.' }, { status: 400 })
  }

  const entries = Object.entries(secrets as Record<string, unknown>)
  if (entries.length === 0) {
    return NextResponse.json({ error: 'No secrets provided.' }, { status: 400 })
  }

  const clean: Record<string, string> = {}
  for (const [key, value] of entries) {
    if (!KEY_RE.test(key)) {
      return NextResponse.json(
        { error: `"${key}" is not a valid name — use uppercase letters, digits and underscores (e.g. SUPABASE_URL).` },
        { status: 400 },
      )
    }
    clean[key] = value == null ? '' : String(value)
  }

  const result = await setAppSecrets(app.flyApp, clean)

  // Persist the PUBLIC (client-inlined) vars so the next build can bake the real
  // values into the browser bundle. Runtime Fly secrets can't fix these because
  // frameworks freeze them in at build time. Best-effort: a failure here doesn't
  // fail the secrets call (they're still set as runtime secrets).
  const publicEnv: Record<string, string> = {}
  for (const [key, value] of Object.entries(clean)) {
    if (PUBLIC_ENV_RE.test(key)) publicEnv[key] = value
  }
  if (Object.keys(publicEnv).length > 0) {
    try {
      await setAppBuildEnv(app.id, user.id, publicEnv)
    } catch {
      // non-fatal — values are still set as runtime secrets
    }
  }

  // Restart so the new secrets take effect now. If it fails, the values are
  // still saved and will apply on the next deploy — so we don't fail the call.
  let applied = true
  try {
    await appLifecycle(app.flyApp, 'restart')
  } catch {
    applied = false
  }

  return NextResponse.json({
    ok: true,
    count: result.count,
    note: applied ? undefined : 'Secrets saved — they will take effect on your next deploy.',
  })
}

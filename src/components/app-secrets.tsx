'use client'

import type { AppMeta } from '@/lib/app-store'

// STUB — replaced by the secrets feature (step 6): set real env vars/secrets so
// logins & payments work. Owns app/api/apps/[id]/secrets/route.ts.
export function AppSecrets({ app }: { app: AppMeta }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900">Environment &amp; secrets</h3>
      <p className="mt-1 text-xs text-gray-400">Set API keys and secrets here (coming).</p>
      <p className="sr-only">{app.flyApp}</p>
    </section>
  )
}

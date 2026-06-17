'use client'

import type { AppMeta } from '@/lib/app-store'

// STUB — replaced by the lifecycle feature (step 9): restart, start/stop,
// redeploy, and a basic usage view. Owns app/api/apps/[id]/route.ts.
export function AppLifecycle({ app }: { app: AppMeta }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900">Status &amp; controls</h3>
      <p className="mt-1 text-xs text-gray-400">Start/stop, redeploy and usage coming here.</p>
      <p className="sr-only">{app.flyApp}</p>
    </section>
  )
}

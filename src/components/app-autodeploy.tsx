'use client'

import type { AppMeta } from '@/lib/app-store'

// STUB — replaced by the auto-redeploy feature (step 8): show how to connect a
// GitHub webhook so the app rebuilds on every push. Owns app/api/webhooks/github/route.ts.
export function AppAutoDeploy({ app }: { app: AppMeta }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900">Auto-deploy on push</h3>
      <p className="mt-1 text-xs text-gray-400">Rebuild automatically when you push to GitHub (coming).</p>
      <p className="sr-only">{app.repo}</p>
    </section>
  )
}

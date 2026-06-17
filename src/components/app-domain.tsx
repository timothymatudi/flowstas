'use client'

import type { AppMeta } from '@/lib/app-store'

// STUB — replaced by the custom-domain feature (step 7): attach theirname.com to
// the app with auto HTTPS + DNS instructions. Owns app/api/apps/[id]/domain/route.ts.
export function AppDomain({ app }: { app: AppMeta }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900">Custom domain</h3>
      <p className="mt-1 text-xs text-gray-400">Put this app on your own domain (coming).</p>
      <p className="sr-only">{app.customDomain ?? app.flyApp}</p>
    </section>
  )
}

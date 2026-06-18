'use client'

import { useState } from 'react'
import type { AppMeta } from '@/lib/app-store'
import { AppLifecycle } from '@/components/app-lifecycle'
import { AppSecrets } from '@/components/app-secrets'
import { AppDomain } from '@/components/app-domain'
import { AppAutoDeploy } from '@/components/app-autodeploy'
import { AppAssistant } from '@/components/app-assistant'

// Inline management panel for a deployed app. This file owns the layout only;
// each feature lives in its own component (lifecycle, secrets, domain) so they
// can be built independently. Add a new panel by dropping in another component.
export function ManageApp({ app }: { app: AppMeta }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        {open ? 'Hide settings' : 'Manage app'} {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className="mt-4 space-y-6">
          <AppLifecycle app={app} />
          <AppSecrets app={app} />
          <AppDomain app={app} />
          <AppAutoDeploy app={app} />
          <AppAssistant app={app} />
        </div>
      )}
    </div>
  )
}

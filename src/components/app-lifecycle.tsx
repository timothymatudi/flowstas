'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AppMeta } from '@/lib/app-store'

// Status summary + lifecycle controls (start / stop / restart / delete) for a
// deployed compute app. Talks to app/api/apps/[id]/route.ts.
export function AppLifecycle({ app }: { app: AppMeta }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function lifecycle(action: 'stop' | 'start' | 'restart') {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not update the app.')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the app.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this app? This stops it and removes it for good.')) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/apps/${app.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not delete the app.')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the app.')
    } finally {
      setBusy(false)
    }
  }

  const statusColor =
    app.status === 'live'
      ? 'text-green-600'
      : app.status === 'error'
        ? 'text-red-600'
        : app.status === 'building'
          ? 'text-amber-600'
          : 'text-gray-500'

  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900">Status &amp; controls</h3>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>
          Status <span className={`font-medium ${statusColor}`}>{app.status}</span>
        </span>
        <span>
          Branch <span className="font-medium text-gray-700">{app.branch || 'default'}</span>
        </span>
        <span>
          Created{' '}
          <span className="font-medium text-gray-700">
            {new Date(app.createdAt).toLocaleDateString()}
          </span>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {app.status === 'live' && (
          <button
            onClick={() => lifecycle('stop')}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Stop
          </button>
        )}
        {app.status === 'stopped' && (
          <button
            onClick={() => lifecycle('start')}
            disabled={busy}
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
          >
            Start
          </button>
        )}
        {app.status !== 'stopped' && (
          <button
            onClick={() => lifecycle('restart')}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Restart
          </button>
        )}
        <button
          onClick={remove}
          disabled={busy}
          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Delete app
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </section>
  )
}

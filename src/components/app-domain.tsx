'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AppMeta } from '@/lib/app-store'

// Panel for connecting a customer's own domain (e.g. app.yourbusiness.com) to a
// deployed app. On connect, Flowstas returns the A/AAAA records the customer
// adds at their domain provider; HTTPS turns on automatically once DNS resolves.
export function AppDomain({ app }: { app: AppMeta }) {
  const router = useRouter()
  const [domain, setDomain] = useState('')
  const [connected, setConnected] = useState<string | null>(app.customDomain)
  // DNS targets are only known right after a connect call (they aren't stored on
  // the app), so they may be null when an already-connected domain loads.
  const [records, setRecords] = useState<{ a?: string; aaaa?: string }>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    const value = domain.trim()
    if (!value) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/apps/${app.id}/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not connect that domain.')
      setConnected(data.domain as string)
      setRecords({ a: data.a as string | undefined, aaaa: data.aaaa as string | undefined })
      setDomain('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect that domain.')
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/apps/${app.id}/domain`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not disconnect.')
      setConnected(null)
      setRecords({})
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not disconnect.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Connect your own domain</p>

      {connected ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-green-700">✓ {connected} connected</p>
          <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
            {records.a || records.aaaa ? (
              <>
                <p className="mb-2">At your domain provider, add these records:</p>
                {records.a && (
                  <p>
                    <span className="font-medium text-foreground">A record</span> · point{' '}
                    <span className="font-mono text-foreground">{connected}</span> to{' '}
                    <span className="font-mono text-foreground">{records.a}</span>
                  </p>
                )}
                {records.aaaa && (
                  <p>
                    <span className="font-medium text-foreground">AAAA record</span> · point{' '}
                    <span className="font-mono text-foreground">{connected}</span> to{' '}
                    <span className="font-mono text-foreground">{records.aaaa}</span>
                  </p>
                )}
              </>
            ) : (
              <p>DNS targets are shown right after connecting.</p>
            )}
            <p className="mt-2 text-muted-foreground">
              These point your domain at the Flowstas servers. HTTPS turns on automatically once your
              DNS points to us — usually within the hour.
            </p>
          </div>
          <button
            onClick={disconnect}
            disabled={busy}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            {busy ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="app.yourbusiness.com"
            disabled={busy}
            className="input-modern flex-1 min-w-[180px] px-3 py-2 text-sm disabled:opacity-50"
          />
          <button
            onClick={connect}
            disabled={busy || !domain.trim()}
            className="btn-primary rounded-lg px-3 py-2 text-sm"
          >
            {busy ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}

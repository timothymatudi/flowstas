'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Standalone password control for one site on the /passwords page. Calls the
// same PATCH /api/sites/[id] endpoint the inline editor uses; ownership is
// re-checked server-side, so this only ever affects sites you own.
export function SitePasswordForm({ id, hasPassword }: { id: string; hasPassword: boolean }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function patch(value: string, okMsg: string) {
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save')
      setOk(okMsg)
      setPassword('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={hasPassword ? 'Enter a new password…' : 'Set a password…'}
          className="input-modern flex-1 min-w-[180px] px-3 py-2 text-sm"
        />
        <button
          onClick={() => patch(password, 'Password updated — the site is now protected.')}
          disabled={busy || !password.trim()}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {hasPassword ? 'Change password' : 'Set password'}
        </button>
        {hasPassword && (
          <button
            onClick={() => patch('', 'Password removed — the site is public again.')}
            disabled={busy}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {ok && <p className="mt-2 text-sm text-green-600">{ok}</p>}
    </div>
  )
}

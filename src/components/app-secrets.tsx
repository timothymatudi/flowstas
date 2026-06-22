'use client'

import { useState } from 'react'
import type { AppMeta } from '@/lib/app-store'

type Row = { key: string; value: string }

// Per-app environment / secrets manager. Lets the owner add KEY=value rows and
// save them to their Fly app so logins, payments, etc. work. Values are
// write-only — we never read saved secrets back. Owns
// app/api/apps/[id]/secrets/route.ts.
export function AppSecrets({ app }: { app: AppMeta }) {
  const [rows, setRows] = useState<Row[]>([{ key: '', value: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  function update(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function addRow() {
    setRows((rs) => [...rs, { key: '', value: '' }])
  }
  function removeRow(i: number) {
    setRows((rs) => (rs.length === 1 ? [{ key: '', value: '' }] : rs.filter((_, idx) => idx !== i)))
  }

  async function save() {
    setError(null)
    setOk(null)

    const secrets: Record<string, string> = {}
    for (const r of rows) {
      const key = r.key.trim()
      if (!key) continue
      if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
        setError(`"${key}" isn't a valid name — use uppercase letters, digits and underscores (e.g. SUPABASE_URL).`)
        return
      }
      secrets[key] = r.value
    }
    if (Object.keys(secrets).length === 0) {
      setError('Add at least one variable before saving.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/apps/${app.id}/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secrets }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save secrets')
      setOk(
        `Saved ${data.count} variable${data.count === 1 ? '' : 's'}. ` +
          'NEXT_PUBLIC_* values take effect on your next deploy.',
      )
      setRows([{ key: '', value: '' }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save secrets')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground">Environment &amp; secrets</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Set API keys and secrets (e.g. <span className="font-mono">SUPABASE_URL</span>) so logins and payments
        work. Values are write-only — for security we never show saved values back.{' '}
        <span className="font-mono">NEXT_PUBLIC_*</span> variables only take effect on your next deploy.
      </p>

      <div className="mt-3 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input
              value={row.key}
              onChange={(e) => update(i, { key: e.target.value.toUpperCase() })}
              disabled={saving}
              placeholder="KEY"
              spellCheck={false}
              className="input-modern w-40 px-3 py-2 font-mono text-sm uppercase disabled:opacity-50"
            />
            <input
              value={row.value}
              onChange={(e) => update(i, { value: e.target.value })}
              disabled={saving}
              placeholder="value"
              spellCheck={false}
              className="input-modern min-w-[160px] flex-1 px-3 py-2 font-mono text-sm disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={saving}
              aria-label="Remove this variable"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addRow}
          disabled={saving}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
        >
          + Add variable
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary rounded-lg px-4 py-2 text-sm"
        >
          {saving ? 'Saving…' : 'Save secrets'}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {ok && <p className="mt-3 text-sm text-green-600">{ok}</p>}
    </section>
  )
}

'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DNS_CNAME_TARGET, DNS_A_RECORD } from '@/lib/domain-dns'

// Inline "Edit" panel for a published site: rename + change subdomain, or
// replace the site's content (paste HTML, or upload a folder / .zip).
export function ManageSite({
  id,
  name: initialName,
  subdomain: initialSubdomain,
  customDomain: initialDomain,
  hasPassword,
}: {
  id: string
  name: string
  subdomain: string
  customDomain: string | null
  hasPassword: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialName)
  const [subdomain, setSubdomain] = useState(initialSubdomain)
  const [domain, setDomain] = useState(initialDomain ?? '')
  const [password, setPassword] = useState('')
  const [html, setHtml] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const zipInput = useRef<HTMLInputElement>(null)

  async function patch(payload: Record<string, unknown>, okMsg: string) {
    setBusy(true); setError(null); setOk(null)
    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save')
      setOk(okMsg)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function saveDetails() {
    setBusy(true); setError(null); setOk(null)
    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subdomain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save')
      setOk('Saved.')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function replaceContent(body: BodyInit, headers?: HeadersInit) {
    setBusy(true); setError(null); setOk(null)
    try {
      const res = await fetch(`/api/sites/${id}`, { method: 'PUT', body, headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not update content')
      setOk('Content updated — your live site now shows the new version.')
      setHtml('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update content')
    } finally {
      setBusy(false)
    }
  }

  function uploadFiles(files: File[]) {
    if (files.length === 0) return
    const fd = new FormData()
    const single = files.length === 1 && /\.zip$/i.test(files[0].name)
    if (single) {
      fd.append('zip', files[0])
    } else {
      for (const f of files)
        fd.append('files', f, (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name)
    }
    replaceContent(fd)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
      >
        Edit
      </button>
    )
  }

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-border bg-secondary/50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Site name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-modern px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Subdomain</span>
          <div className="flex items-center">
            <input
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="input-modern rounded-r-none px-3 py-2"
            />
            <span className="rounded-r-[var(--radius)] border border-l-0 border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
              .flowstas.com
            </span>
          </div>
        </label>
      </div>
      <button
        onClick={saveDetails}
        disabled={busy}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Save details'}
      </button>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium text-foreground">Replace content</p>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={4}
          placeholder="Paste new HTML to replace the page…"
          className="input-modern px-3 py-2 font-mono text-xs"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => replaceContent(JSON.stringify({ html }), { 'Content-Type': 'application/json' })}
            disabled={busy || !html.trim()}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            Replace with this HTML
          </button>
          <button
            onClick={() => folderInput.current?.click()}
            disabled={busy}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            📁 Upload folder
          </button>
          <button
            onClick={() => zipInput.current?.click()}
            disabled={busy}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            🗜️ Upload .zip
          </button>
        </div>
        {/* webkitdirectory isn't in React's input typings, so spread it in. */}
        <input
          ref={folderInput}
          type="file"
          hidden
          multiple
          {...{ webkitdirectory: '', directory: '' }}
          onChange={(e) => uploadFiles(Array.from(e.target.files ?? []))}
        />
        <input
          ref={zipInput}
          type="file"
          hidden
          accept=".zip,application/zip"
          onChange={(e) => uploadFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      {/* Custom domain */}
      <div className="border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium text-foreground">Connect your own domain</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="www.yourbusiness.com"
            className="input-modern flex-1 min-w-[180px] px-3 py-2 text-sm"
          />
          <button
            onClick={() => patch({ customDomain: domain }, domain.trim() ? 'Domain connected — add the DNS record below.' : 'Domain removed.')}
            disabled={busy}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {domain.trim() ? 'Connect' : 'Remove'}
          </button>
        </div>
        {domain.trim() && (
          <p className="mt-2 text-xs text-muted-foreground">
            At your domain registrar, add a <span className="font-medium text-foreground">CNAME</span> record
            pointing <span className="font-medium text-foreground">{domain.trim()}</span> to{' '}
            <span className="font-mono text-foreground">{DNS_CNAME_TARGET}</span> (for an apex domain, use an
            A record to <span className="font-mono text-foreground">{DNS_A_RECORD}</span>). HTTPS turns on
            automatically once it resolves.
          </p>
        )}
      </div>

      {/* Password protection */}
      <div className="border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium text-foreground">
          Password protection {hasPassword && <span className="text-amber-700">· currently on</span>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={hasPassword ? 'Enter a new password…' : 'Set a password…'}
            className="input-modern flex-1 min-w-[180px] px-3 py-2 text-sm"
          />
          <button
            onClick={() => { patch({ password }, 'Password updated.'); setPassword('') }}
            disabled={busy || !password.trim()}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {hasPassword ? 'Change' : 'Set'}
          </button>
          {hasPassword && (
            <button
              onClick={() => patch({ password: '' }, 'Password removed — the site is public again.')}
              disabled={busy}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {ok && <p className="text-sm text-green-600">{ok}</p>}

      <button onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:underline">
        Close
      </button>
    </div>
  )
}

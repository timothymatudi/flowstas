'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Inline "Edit" panel for a published site: rename + change subdomain, or
// replace the site's content (paste HTML, or upload a folder / .zip).
export function ManageSite({
  id,
  name: initialName,
  subdomain: initialSubdomain,
}: {
  id: string
  name: string
  subdomain: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialName)
  const [subdomain, setSubdomain] = useState(initialSubdomain)
  const [html, setHtml] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const zipInput = useRef<HTMLInputElement>(null)

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
        className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
      >
        Edit
      </button>
    )
  }

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Site name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-gray-900"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Subdomain</span>
          <div className="flex items-center">
            <input
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="w-full rounded-l-lg border border-gray-200 px-3 py-2 outline-none focus:border-gray-900"
            />
            <span className="rounded-r-lg border border-l-0 border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500">
              .flowstas.com
            </span>
          </div>
        </label>
      </div>
      <button
        onClick={saveDetails}
        disabled={busy}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Save details'}
      </button>

      <div className="border-t border-gray-200 pt-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Replace content</p>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={4}
          placeholder="Paste new HTML to replace the page…"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs outline-none focus:border-gray-900"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => replaceContent(JSON.stringify({ html }), { 'Content-Type': 'application/json' })}
            disabled={busy || !html.trim()}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Replace with this HTML
          </button>
          <button
            onClick={() => folderInput.current?.click()}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            📁 Upload folder
          </button>
          <button
            onClick={() => zipInput.current?.click()}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
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

      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-green-600">{ok}</p>}

      <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:underline">
        Close
      </button>
    </div>
  )
}

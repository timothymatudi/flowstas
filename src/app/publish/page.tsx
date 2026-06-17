'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { SAMPLE_TEMPLATE } from '@/lib/sample-site'
import { TEMPLATES } from '@/lib/templates'
import { DNS_CNAME_TARGET, DNS_A_RECORD } from '@/lib/domain-dns'

type Mode = 'paste' | 'upload' | 'import' | 'templates' | 'github'

// One picked file plus the path it should live at inside the site (so a dropped
// or chosen folder keeps its structure: e.g. "css/styles.css").
type Picked = { file: File; path: string }

// Recursively walk a dropped FileSystemEntry into Picked items, preserving the
// folder layout. Drag-and-drop is the only way to get a folder's relative paths
// without the <input webkitdirectory> picker.
async function readEntry(entry: FileSystemEntry, prefix = ''): Promise<Picked[]> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry
    const file = await new Promise<File>((resolve, reject) =>
      fileEntry.file(resolve, reject)
    )
    return [{ file, path: prefix + entry.name }]
  }
  const dirReader = (entry as FileSystemDirectoryEntry).createReader()
  const out: Picked[] = []
  // readEntries returns at most ~100 entries per call, so loop until empty.
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
      dirReader.readEntries(resolve, reject)
    )
    if (batch.length === 0) break
    for (const child of batch) {
      out.push(...(await readEntry(child, `${prefix}${entry.name}/`)))
    }
  }
  return out
}

// Turn a drop's DataTransferItemList into Picked items (folders + files).
async function readDrop(items: DataTransferItemList): Promise<Picked[]> {
  const roots: FileSystemEntry[] = []
  for (const item of Array.from(items)) {
    const entry = item.webkitGetAsEntry?.()
    if (entry) roots.push(entry)
  }
  const all: Picked[] = []
  for (const root of roots) all.push(...(await readEntry(root)))
  return all
}

export default function PublishPage() {
  const [mode, setMode] = useState<Mode>('paste')
  const [name, setName] = useState('')
  const [html, setHtml] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [picked, setPicked] = useState<Picked[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorLink, setErrorLink] = useState<{ href: string; label: string } | null>(null)
  const [liveUrl, setLiveUrl] = useState<string | null>(null)
  const [siteId, setSiteId] = useState<string | null>(null)
  // Custom-domain step shown on the success screen.
  const [ownDomain, setOwnDomain] = useState('')
  const [connectedDomain, setConnectedDomain] = useState<string | null>(null)
  const [domainBusy, setDomainBusy] = useState(false)
  const [domainError, setDomainError] = useState<string | null>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const zipInput = useRef<HTMLInputElement>(null)

  async function publish(body: BodyInit, headers?: HeadersInit) {
    setLoading(true)
    setError(null)
    setErrorLink(null)
    try {
      const res = await fetch('/api/sites', { method: 'POST', body, headers })
      const data = await res.json()
      if (!res.ok) {
        if (data.needsAuth) setErrorLink({ href: '/auth/login', label: 'Log in' })
        else if (data.needsUpgrade) setErrorLink({ href: '/pricing', label: 'View plans' })
        throw new Error(data.error || 'Could not publish')
      }
      setLiveUrl(data.url)
      setSiteId(data.id ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish')
    } finally {
      setLoading(false)
    }
  }

  function handlePaste(e: React.FormEvent) {
    e.preventDefault()
    if (!html.trim()) {
      setError('Add some HTML for your site first — or click "Use a sample site".')
      return
    }
    publish(JSON.stringify({ name, html }), { 'Content-Type': 'application/json' })
  }

  function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!importUrl.trim()) {
      setError('Paste the address of the site you want to import first.')
      return
    }
    publish(JSON.stringify({ name, importUrl }), { 'Content-Type': 'application/json' })
  }

  function handleGithub(e: React.FormEvent) {
    e.preventDefault()
    if (!repoUrl.trim()) {
      setError('Paste the link to your GitHub repo first.')
      return
    }
    publish(JSON.stringify({ name, repoUrl }), { 'Content-Type': 'application/json' })
  }

  function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (picked.length === 0) {
      setError('Drop, choose a folder, or pick a .zip of your website first.')
      return
    }
    const fd = new FormData()
    fd.append('name', name)
    const single = picked.length === 1 && /\.zip$/i.test(picked[0].path)
    if (single) {
      fd.append('zip', picked[0].file)
    } else {
      for (const p of picked) fd.append('files', p.file, p.path)
    }
    publish(fd)
  }

  // Map a FileList from the folder/zip pickers into Picked items, keeping the
  // folder layout via webkitRelativePath when the browser provides it.
  function pickFromInput(list: FileList | null) {
    const next: Picked[] = Array.from(list ?? []).map((f) => ({
      file: f,
      path: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
    }))
    setPicked(next)
    setError(null)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    setError(null)
    try {
      const items = await readDrop(e.dataTransfer.items)
      if (items.length === 0) {
        setError('Could not read what you dropped — try the folder or .zip picker instead.')
        return
      }
      setPicked(items)
    } catch {
      setError('Could not read what you dropped — try the folder or .zip picker instead.')
    }
  }

  async function connectOwnDomain(e: React.FormEvent) {
    e.preventDefault()
    if (!siteId || !ownDomain.trim()) {
      setDomainError('Enter the domain you own first, e.g. www.yourbusiness.com.')
      return
    }
    setDomainBusy(true)
    setDomainError(null)
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDomain: ownDomain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not connect that domain.')
      setConnectedDomain(ownDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    } catch (err) {
      setDomainError(err instanceof Error ? err.message : 'Could not connect that domain.')
    } finally {
      setDomainBusy(false)
    }
  }

  function reset() {
    setLiveUrl(null)
    setSiteId(null)
    setOwnDomain('')
    setConnectedDomain(null)
    setDomainError(null)
    setHtml('')
    setName('')
    setImportUrl('')
    setRepoUrl('')
    setPicked([])
  }

  if (liveUrl) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            🎉
          </div>
          <h1 className="text-center text-2xl font-bold text-gray-900">Your site is live!</h1>

          {/* The subdomain is only a preview — the real home is the user's domain. */}
          <div className="mt-6 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Temporary preview link
            </p>
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all font-medium text-gray-900 underline"
            >
              {liveUrl}
            </a>
          </div>

          {/* Connect your own domain — the headline address. */}
          <div className="mt-4 rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-900">Put it on your own domain</p>
            {connectedDomain ? (
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                <p className="font-medium text-green-700">
                  ✓ {connectedDomain} is connected — now point it to us:
                </p>
                <ul className="list-disc space-y-1 pl-5 text-xs text-gray-500">
                  <li>
                    At your domain provider, add a <span className="font-medium text-gray-700">CNAME</span>{' '}
                    record from <span className="font-mono text-gray-700">{connectedDomain}</span> to{' '}
                    <span className="font-mono text-gray-700">{DNS_CNAME_TARGET}</span>.
                  </li>
                  <li>
                    For a root domain (no “www”), add an{' '}
                    <span className="font-medium text-gray-700">A</span> record to{' '}
                    <span className="font-mono text-gray-700">{DNS_A_RECORD}</span> instead.
                  </li>
                </ul>
                <p className="text-xs text-gray-400">
                  Your secure address ({connectedDomain}) goes live automatically once it points to us —
                  usually within an hour.
                </p>
              </div>
            ) : (
              <form onSubmit={connectOwnDomain} className="mt-2">
                <p className="mb-2 text-xs text-gray-500">
                  Already own a domain? Connect it so visitors see{' '}
                  <span className="font-medium text-gray-700">yourbusiness.com</span> instead of the
                  preview link.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={ownDomain}
                    onChange={(e) => setOwnDomain(e.target.value)}
                    placeholder="www.yourbusiness.com"
                    className="min-w-[180px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
                  <button
                    type="submit"
                    disabled={domainBusy}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    {domainBusy ? 'Connecting…' : 'Connect'}
                  </button>
                </div>
                {domainError && <p className="mt-2 text-xs text-red-600">{domainError}</p>}
              </form>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={reset}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Publish another
            </button>
            <Link
              href="/sites"
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
            >
              See my sites &amp; messages
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900">Publish a website</h1>
        <p className="mt-2 text-gray-500">
          Put your site online in one click. Its contact form captures every message straight to
          your dashboard.
        </p>

        <div className="mt-6 inline-flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => { setMode('paste'); setError(null) }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === 'paste' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Paste HTML
          </button>
          <button
            type="button"
            onClick={() => { setMode('upload'); setError(null) }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Upload folder or .zip
          </button>
          <button
            type="button"
            onClick={() => { setMode('import'); setError(null) }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === 'import' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Import from URL
          </button>
          <button
            type="button"
            onClick={() => { setMode('templates'); setError(null) }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === 'templates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Start from a template
          </button>
          <button
            type="button"
            onClick={() => { setMode('github'); setError(null) }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === 'github' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            From GitHub
          </button>
        </div>

        {mode === 'github' ? (
          <form onSubmit={handleGithub} className="mt-4 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Site name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Leave blank to use the repo name"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Public GitHub repo</label>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/you/your-site"
                inputMode="url"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900"
              />
              <p className="mt-2 text-xs text-gray-400">
                We pull the repo and publish its files as-is. Best for static sites (HTML, CSS, JS) —
                we don’t run a build step. Add{' '}
                <code className="rounded bg-gray-100 px-1 py-0.5">/tree/branch</code> to the link for a
                specific branch.
              </p>
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
                {errorLink && (
                  <Link href={errorLink.href} className="ml-2 font-semibold underline">
                    {errorLink.label} →
                  </Link>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-6 py-4 font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Publishing from GitHub…' : 'Publish from GitHub →'}
            </button>
          </form>
        ) : mode === 'templates' ? (
          <div className="mt-4 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              No files? Pick a starting point — we’ll drop it into the editor so you can change the
              words and publish.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setHtml(tpl.html)
                    if (!name) setName(tpl.name)
                    setMode('paste')
                    setError(null)
                  }}
                  className="rounded-xl border border-gray-200 p-5 text-left hover:border-gray-900 hover:bg-gray-50"
                >
                  <div className="text-3xl">{tpl.emoji}</div>
                  <div className="mt-2 font-semibold text-gray-900">{tpl.name}</div>
                  <div className="text-sm text-gray-500">{tpl.tagline}</div>
                  <div className="mt-3 text-sm font-medium text-blue-600">Customize &amp; publish →</div>
                </button>
              ))}
            </div>
          </div>
        ) : mode === 'import' ? (
          <form onSubmit={handleImport} className="mt-4 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Site name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Leave blank to use the site’s name"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Website address to import</label>
              <input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://example.com"
                inputMode="url"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900"
              />
              <p className="mt-2 text-xs text-gray-400">
                We snapshot the page and serve it as your site. Its images and styles keep loading
                from the original address.
              </p>
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
                {errorLink && (
                  <Link href={errorLink.href} className="ml-2 font-semibold underline">
                    {errorLink.label} →
                  </Link>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-6 py-4 font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Importing…' : 'Import &amp; publish →'}
            </button>
          </form>
        ) : mode === 'paste' ? (
          <form onSubmit={handlePaste} className="mt-4 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Site name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My business site"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Your website HTML</label>
                <button
                  type="button"
                  onClick={() => {
                    setHtml(SAMPLE_TEMPLATE)
                    if (!name) setName("Bella's Bakery")
                  }}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Use a sample site
                </button>
              </div>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={12}
                placeholder="<!doctype html> ..."
                className="w-full rounded-lg border border-gray-200 px-4 py-3 font-mono text-sm outline-none focus:border-gray-900"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
                {errorLink && (
                  <Link href={errorLink.href} className="ml-2 font-semibold underline">
                    {errorLink.label} →
                  </Link>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-6 py-4 font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Publishing…' : 'Publish my site →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpload} className="mt-4 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Site name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My business site"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900"
              />
            </div>

            <p className="text-sm text-gray-500">
              Upload your whole site — HTML, CSS, images and all. Drag the folder straight in, or use
              the pickers. We serve{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">index.html</code> as the home
              page.
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
                dragOver ? 'border-gray-900 bg-gray-50' : 'border-gray-300'
              }`}
            >
              <p className="text-3xl">📂</p>
              <p className="mt-2 text-sm font-medium text-gray-700">
                Drag &amp; drop your website folder here
              </p>
              <p className="mt-1 text-xs text-gray-400">…or choose it manually</p>
              <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => folderInput.current?.click()}
                  className="rounded-xl border border-dashed border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:border-gray-900 hover:bg-white"
                >
                  📁 Choose a folder
                </button>
                <button
                  type="button"
                  onClick={() => zipInput.current?.click()}
                  className="rounded-xl border border-dashed border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:border-gray-900 hover:bg-white"
                >
                  🗜️ Choose a .zip
                </button>
              </div>
            </div>

            {/* webkitdirectory isn't in React's input typings, so spread it in. */}
            <input
              ref={folderInput}
              type="file"
              hidden
              multiple
              {...{ webkitdirectory: '', directory: '' }}
              onChange={(e) => pickFromInput(e.target.files)}
            />
            <input
              ref={zipInput}
              type="file"
              hidden
              accept=".zip,application/zip"
              onChange={(e) => pickFromInput(e.target.files)}
            />

            {picked.length > 0 && (
              <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {picked.length === 1 && /\.zip$/i.test(picked[0].path)
                  ? `Selected zip: ${picked[0].file.name}`
                  : `Ready to publish ${picked.length} file${picked.length === 1 ? '' : 's'}.`}
              </p>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
                {errorLink && (
                  <Link href={errorLink.href} className="ml-2 font-semibold underline">
                    {errorLink.label} →
                  </Link>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-6 py-4 font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Publishing…' : 'Publish my site →'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

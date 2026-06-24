'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('publishPage')
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
        if (data.needsAuth) setErrorLink({ href: '/auth/login', label: t('logIn') })
        else if (data.needsUpgrade) setErrorLink({ href: '/pricing', label: t('viewPlans') })
        throw new Error(data.error || t('couldNotPublish'))
      }
      setLiveUrl(data.url)
      setSiteId(data.id ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('couldNotPublish'))
    } finally {
      setLoading(false)
    }
  }

  function handlePaste(e: React.FormEvent) {
    e.preventDefault()
    if (!html.trim()) {
      setError(t('errNeedHtml'))
      return
    }
    publish(JSON.stringify({ name, html }), { 'Content-Type': 'application/json' })
  }

  function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!importUrl.trim()) {
      setError(t('errNeedImportUrl'))
      return
    }
    publish(JSON.stringify({ name, importUrl }), { 'Content-Type': 'application/json' })
  }

  function handleGithub(e: React.FormEvent) {
    e.preventDefault()
    if (!repoUrl.trim()) {
      setError(t('errNeedRepo'))
      return
    }
    publish(JSON.stringify({ name, repoUrl }), { 'Content-Type': 'application/json' })
  }

  function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (picked.length === 0) {
      setError(t('errNeedFiles'))
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
        setError(t('errDropFailed'))
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
      setDomainError(t('errNeedDomain'))
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
      if (!res.ok) throw new Error(data.error || t('errConnectDomain'))
      setConnectedDomain(ownDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    } catch (err) {
      setDomainError(err instanceof Error ? err.message : t('errConnectDomain'))
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
          <h1 className="text-center text-2xl font-bold text-gray-900">{t('liveTitle')}</h1>

          {/* The subdomain is only a preview — the real home is the user's domain. */}
          <div className="mt-6 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {t('tempPreviewLabel')}
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
            <p className="text-sm font-semibold text-gray-900">{t('ownDomainTitle')}</p>
            {connectedDomain ? (
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                <p className="font-medium text-green-700">
                  ✓ {t('domainConnected', { domain: connectedDomain })}
                </p>
                <ul className="list-disc space-y-1 pl-5 text-xs text-gray-500">
                  <li>
                    {t('dnsCname', { domain: connectedDomain, target: DNS_CNAME_TARGET })}
                  </li>
                  <li>
                    {t('dnsARecord', { record: DNS_A_RECORD })}
                  </li>
                </ul>
                <p className="text-xs text-gray-400">
                  {t('secureGoLive', { domain: connectedDomain })}
                </p>
              </div>
            ) : (
              <form onSubmit={connectOwnDomain} className="mt-2">
                <p className="mb-2 text-xs text-gray-500">
                  {t('alreadyOwnDomain')}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={ownDomain}
                    onChange={(e) => setOwnDomain(e.target.value)}
                    placeholder={t('domainPlaceholder')}
                    className="min-w-[180px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
                  <button
                    type="submit"
                    disabled={domainBusy}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    {domainBusy ? t('connecting') : t('connect')}
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
              {t('publishAnother')}
            </button>
            <Link
              href="/sites"
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('seeMySites')}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-2 text-gray-500">
          {t('subtitle')}
        </p>

        <div className="mt-6 inline-flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => { setMode('paste'); setError(null) }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === 'paste' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            {t('tabPaste')}
          </button>
          <button
            type="button"
            onClick={() => { setMode('upload'); setError(null) }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            {t('tabUpload')}
          </button>
          <button
            type="button"
            onClick={() => { setMode('import'); setError(null) }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === 'import' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            {t('tabImport')}
          </button>
          <button
            type="button"
            onClick={() => { setMode('templates'); setError(null) }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === 'templates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            {t('tabTemplates')}
          </button>
          <button
            type="button"
            onClick={() => { setMode('github'); setError(null) }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === 'github' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            {t('tabGithub')}
          </button>
        </div>

        {mode === 'github' ? (
          <form onSubmit={handleGithub} className="mt-4 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('siteNameLabel')}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('siteNamePlaceholderRepo')}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('publicRepoLabel')}</label>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/you/your-site"
                inputMode="url"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900"
              />
              <p className="mt-2 text-xs text-gray-400">
                {t('githubHelp1')}{' '}
                <code className="rounded bg-gray-100 px-1 py-0.5">/tree/branch</code>{' '}
                {t('githubHelp2')}
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
              {loading ? t('publishingGithub') : t('publishGithubCta')}
            </button>
          </form>
        ) : mode === 'templates' ? (
          <div className="mt-4 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              {t('templatesIntro')}
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
                  <div className="mt-3 text-sm font-medium text-blue-600">{t('customizePublish')}</div>
                </button>
              ))}
            </div>
          </div>
        ) : mode === 'import' ? (
          <form onSubmit={handleImport} className="mt-4 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('siteNameLabel')}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('siteNamePlaceholderSite')}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('importUrlLabel')}</label>
              <input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://example.com"
                inputMode="url"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900"
              />
              <p className="mt-2 text-xs text-gray-400">
                {t('importHelp')}
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
              {loading ? t('importing') : t('importCta')}
            </button>
          </form>
        ) : mode === 'paste' ? (
          <form onSubmit={handlePaste} className="mt-4 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('siteNameLabel')}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('siteNamePlaceholderBusiness')}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">{t('htmlLabel')}</label>
                <button
                  type="button"
                  onClick={() => {
                    setHtml(SAMPLE_TEMPLATE)
                    if (!name) setName("Bella's Bakery")
                  }}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {t('useSample')}
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
              {loading ? t('publishing') : t('publishCta')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpload} className="mt-4 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('siteNameLabel')}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('siteNamePlaceholderBusiness')}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900"
              />
            </div>

            <p className="text-sm text-gray-500">
              {t('uploadIntro1')}{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">index.html</code>{' '}
              {t('uploadIntro2')}
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
                {t('dropHere')}
              </p>
              <p className="mt-1 text-xs text-gray-400">{t('orChooseManually')}</p>
              <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => folderInput.current?.click()}
                  className="rounded-xl border border-dashed border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:border-gray-900 hover:bg-white"
                >
                  📁 {t('chooseFolder')}
                </button>
                <button
                  type="button"
                  onClick={() => zipInput.current?.click()}
                  className="rounded-xl border border-dashed border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:border-gray-900 hover:bg-white"
                >
                  🗜️ {t('chooseZip')}
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
                  ? t('selectedZip', { name: picked[0].file.name })
                  : t('readyToPublish', { count: picked.length })}
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
              {loading ? t('publishing') : t('publishCta')}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

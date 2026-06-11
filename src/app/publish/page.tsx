'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { SAMPLE_TEMPLATE } from '@/lib/sample-site'

type Mode = 'paste' | 'upload'

export default function PublishPage() {
  const [mode, setMode] = useState<Mode>('paste')
  const [name, setName] = useState('')
  const [html, setHtml] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveUrl, setLiveUrl] = useState<string | null>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const zipInput = useRef<HTMLInputElement>(null)

  async function publish(body: BodyInit, headers?: HeadersInit) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sites', { method: 'POST', body, headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not publish')
      setLiveUrl(data.url)
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

  function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (files.length === 0) {
      setError('Choose a folder or a .zip of your website first.')
      return
    }
    const fd = new FormData()
    fd.append('name', name)
    const single = files.length === 1 && /\.zip$/i.test(files[0].name)
    if (single) {
      fd.append('zip', files[0])
    } else {
      for (const f of files) fd.append('files', f, (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name)
    }
    publish(fd)
  }

  function reset() {
    setLiveUrl(null)
    setHtml('')
    setName('')
    setFiles([])
  }

  if (liveUrl) {
    const full = (typeof window !== 'undefined' ? window.location.origin : '') + liveUrl
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            🎉
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Your site is live!</h1>
          <p className="mt-2 text-gray-500">Anyone with this link can open it right now.</p>
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 block rounded-xl bg-gray-900 px-6 py-4 font-semibold text-white hover:bg-gray-700"
          >
            Open your live site →
          </a>
          <p className="mt-3 break-all text-sm text-gray-400">{full}</p>
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
          Put your site online in one click. Its contact form will capture messages and alert you
          automatically.
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
        </div>

        {mode === 'paste' ? (
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
            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
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
              Upload your whole site — HTML, CSS, images and all. Pick the folder it lives in, or a
              <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs">.zip</code> of it. We
              serve <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">index.html</code> as the
              home page.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => folderInput.current?.click()}
                className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm font-medium text-gray-700 hover:border-gray-900 hover:bg-gray-50"
              >
                📁 Choose a folder
              </button>
              <button
                type="button"
                onClick={() => zipInput.current?.click()}
                className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm font-medium text-gray-700 hover:border-gray-900 hover:bg-gray-50"
              >
                🗜️ Choose a .zip
              </button>
            </div>

            {/* webkitdirectory isn't in React's input typings, so spread it in. */}
            <input
              ref={folderInput}
              type="file"
              hidden
              multiple
              {...{ webkitdirectory: '', directory: '' }}
              onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); setError(null) }}
            />
            <input
              ref={zipInput}
              type="file"
              hidden
              accept=".zip,application/zip"
              onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); setError(null) }}
            />

            {files.length > 0 && (
              <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {files.length === 1 && /\.zip$/i.test(files[0].name)
                  ? `Selected zip: ${files[0].name}`
                  : `Selected ${files.length} file${files.length === 1 ? '' : 's'}.`}
              </p>
            )}
            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
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

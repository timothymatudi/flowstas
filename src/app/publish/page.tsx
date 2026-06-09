'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SAMPLE_TEMPLATE } from '@/lib/sample-site'

export default function PublishPage() {
  const [name, setName] = useState('')
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveUrl, setLiveUrl] = useState<string | null>(null)

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    if (!html.trim()) {
      setError('Add some HTML for your site first — or click "Use a sample site".')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, html }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not publish')
      setLiveUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish')
    } finally {
      setLoading(false)
    }
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
              onClick={() => {
                setLiveUrl(null)
                setHtml('')
                setName('')
              }}
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
          Paste your site&apos;s HTML, give it a name, and put it online in one click. Its contact
          form will capture messages and alert you automatically.
        </p>

        <form onSubmit={handlePublish} className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
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
      </div>
    </main>
  )
}

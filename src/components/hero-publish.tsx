'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Upload, Check } from 'lucide-react'
import { SAMPLE_TEMPLATE } from '@/lib/sample-site'

// The real publish tool, embedded in the homepage hero (like Tiiny.host): paste
// your HTML or drop a .zip and publish right away. Anonymous visitors are sent
// to sign up on submit (publishing requires an account).
export function HeroPublish() {
  const [name, setName] = useState('')
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorLink, setErrorLink] = useState<{ href: string; label: string } | null>(null)
  const [result, setResult] = useState<{ url: string; subdomain: string } | null>(null)
  const zipInput = useRef<HTMLInputElement>(null)

  async function send(body: BodyInit, headers?: HeadersInit) {
    setLoading(true)
    setError(null)
    setErrorLink(null)
    try {
      const res = await fetch('/api/sites', { method: 'POST', body, headers })
      const data = await res.json()
      if (!res.ok) {
        if (data.needsAuth) setErrorLink({ href: '/auth/sign-up', label: 'Create a free account' })
        else if (data.needsUpgrade) setErrorLink({ href: '/pricing', label: 'View plans' })
        throw new Error(data.error || 'Could not publish')
      }
      setResult({ url: data.url, subdomain: data.subdomain })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish')
    } finally {
      setLoading(false)
    }
  }

  function publishHtml() {
    if (!html.trim()) {
      setError('Paste your HTML first — or click “Use a sample”.')
      return
    }
    send(JSON.stringify({ name, html }), { 'Content-Type': 'application/json' })
  }

  function publishZip(file: File) {
    const fd = new FormData()
    fd.append('name', name)
    fd.append('zip', file)
    send(fd)
  }

  if (result) {
    return (
      <div className="relative w-full max-w-xl mx-auto">
        <div className="bg-card rounded-2xl border border-border shadow-premium-lg p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Check className="h-6 w-6" />
          </div>
          <p className="font-display text-2xl text-foreground mb-1">Your site is live</p>
          <a
            href={result.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
          >
            {result.subdomain}.flowstas.com <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-xl mx-auto text-left">
      <div className="absolute -inset-x-8 -top-6 -bottom-6 bg-gradient-to-tr from-primary/10 via-amber-200/20 to-transparent blur-3xl -z-10" />
      <div className="bg-card rounded-2xl border border-border shadow-premium-lg p-5 sm:p-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Site name (optional)"
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary mb-3"
        />
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={5}
          placeholder="<!doctype html> — paste your website’s HTML here…"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-xs outline-none focus:border-primary resize-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setHtml(SAMPLE_TEMPLATE)
              if (!name) setName("Bella's Bakery")
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Use a sample
          </button>
          <button
            type="button"
            onClick={() => zipInput.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Upload className="h-3.5 w-3.5" /> or upload a .zip
          </button>
          <input
            ref={zipInput}
            type="file"
            hidden
            accept=".zip,application/zip"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) publishZip(f)
            }}
          />
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
            {errorLink && (
              <Link href={errorLink.href} className="ml-1.5 font-semibold underline">
                {errorLink.label} →
              </Link>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={publishHtml}
          disabled={loading}
          className="btn-primary mt-4 w-full justify-center text-base flex items-center gap-2 disabled:opacity-60"
        >
          {loading ? 'Publishing…' : 'Publish my site'}
          {!loading && <ArrowRight className="h-5 w-5" />}
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Free to start · live at its own <span className="text-foreground font-medium">.flowstas.com</span> address
        </p>
      </div>
    </div>
  )
}

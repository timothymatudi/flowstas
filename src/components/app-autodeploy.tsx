'use client'

import { useEffect, useState } from 'react'
import type { AppMeta } from '@/lib/app-store'

// Show the user how to connect a GitHub webhook so the app rebuilds on every
// push. The webhook is handled by app/api/webhooks/github/route.ts.
export function AppAutoDeploy({ app }: { app: AppMeta }) {
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(`${window.location.origin}/api/webhooks/github`)
    }
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can fail without permission — the URL is still visible.
    }
  }

  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-foreground">Auto-deploy on push</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Rebuild <span className="font-medium text-foreground">{app.name}</span> automatically every time
        you push to GitHub. Add a webhook in your repo once:
      </p>

      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          In your GitHub repo, open <span className="font-medium text-foreground">Settings → Webhooks → Add webhook</span>.
        </li>
        <li>
          Set <span className="font-medium text-foreground">Payload URL</span> to the address below.
        </li>
        <li>
          Set <span className="font-medium text-foreground">Content type</span> to{' '}
          <span className="font-mono text-foreground">application/json</span>.
        </li>
        <li>
          For <span className="font-medium text-foreground">Secret</span>, use the value set by Flowstas.
        </li>
        <li>
          Under events, choose <span className="font-medium text-foreground">Just the push event</span>, then save.
        </li>
      </ol>

      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-foreground">
          {url || '…'}
        </code>
        <button
          onClick={copy}
          disabled={!url}
          className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </section>
  )
}

'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

// "Connect your app" on-ramp: paste a public GitHub repo, hit deploy, and watch
// the build happen live. This is the compute sibling of /publish (which is for
// static sites). The server route /api/apps streams the worker's build logs back
// as plain text; we render them as they arrive and pull the live URL off the
// final FLOWSTAS_RESULT line.

type Phase = 'idle' | 'building' | 'live' | 'error'

export default function DeployPage() {
  const [name, setName] = useState('')
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [logs, setLogs] = useState('')
  const [liveUrl, setLiveUrl] = useState<string | null>(null)
  const [appId, setAppId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorLink, setErrorLink] = useState<{ href: string; label: string } | null>(null)
  const logBox = useRef<HTMLPreElement>(null)

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault()
    if (!repo.trim()) {
      setError('Paste the link to your app’s GitHub repo first.')
      return
    }
    setPhase('building')
    setError(null)
    setErrorLink(null)
    setLogs('')
    setLiveUrl(null)
    setAppId(null)

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, repo, branch, githubToken }),
      })

      // Non-streaming error (auth, plan limit, bad repo) comes back as JSON.
      const contentType = res.headers.get('content-type') || ''
      if (!res.ok && contentType.includes('application/json')) {
        const data = await res.json()
        if (data.needsAuth) setErrorLink({ href: '/auth/login', label: 'Log in' })
        else if (data.needsUpgrade) setErrorLink({ href: '/pricing', label: 'View plans' })
        throw new Error(data.error || 'Could not start the deploy.')
      }
      if (!res.body) throw new Error('No build output received.')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = '' // everything received, for the final result parse
      let sawAppLine = false
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })

        // The first line is "FLOWSTAS_APP <id>"; capture and strip it from view.
        if (!sawAppLine) {
          const appMatch = full.match(/^FLOWSTAS_APP (\w+)\n/)
          if (appMatch) {
            setAppId(appMatch[1])
            sawAppLine = true
            setLogs(full.slice(appMatch[0].length))
            requestAnimationFrame(() => {
              if (logBox.current) logBox.current.scrollTop = logBox.current.scrollHeight
            })
            continue
          }
        }
        setLogs(sawAppLine ? full.replace(/^FLOWSTAS_APP \w+\n/, '') : full)
        requestAnimationFrame(() => {
          if (logBox.current) logBox.current.scrollTop = logBox.current.scrollHeight
        })
      }

      // The trailing FLOWSTAS_RESULT line carries the outcome.
      const resultMatch = full.match(/FLOWSTAS_RESULT (\{.*\})\s*$/)
      const result = resultMatch ? JSON.parse(resultMatch[1]) : null
      if (result?.ok) {
        setLiveUrl(result.url)
        setPhase('live')
      } else {
        setPhase('error')
        setError(result?.error || 'The build failed. Check the logs above.')
      }
    } catch (err) {
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Could not deploy your app.')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900">Deploy an app</h1>
        <p className="mt-2 text-gray-500">
          Got a real app — Next.js and more — in a GitHub repo? Connect it and Flowstas builds and
          runs it for you, live on the internet. (For simple websites, use{' '}
          <Link href="/publish" className="font-medium text-blue-600 hover:underline">
            Publish a site
          </Link>{' '}
          instead.)
        </p>

        <form onSubmit={handleDeploy} className="mt-6 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">App name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leave blank to use the repo name"
              disabled={phase === 'building'}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">GitHub repo</label>
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="https://github.com/you/your-app"
              inputMode="url"
              disabled={phase === 'building'}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Branch <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              disabled={phase === 'building'}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-gray-900 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Access token <span className="text-gray-400">(only for private repos)</span>
            </label>
            <input
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              type="password"
              placeholder="ghp_… or github_pat_…"
              autoComplete="off"
              spellCheck={false}
              disabled={phase === 'building'}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 font-mono text-sm outline-none focus:border-gray-900 disabled:bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-400">
              For a private repo, paste a GitHub token with read access. It’s used to fetch your
              code once and is never stored.
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
            disabled={phase === 'building'}
            className="w-full rounded-xl bg-gray-900 px-6 py-4 font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {phase === 'building' ? 'Building your app…' : 'Deploy my app →'}
          </button>
        </form>

        {/* Live build logs */}
        {(phase === 'building' || logs) && (
          <div className="mt-6 rounded-2xl bg-gray-900 p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Build logs</p>
              {phase === 'building' && (
                <span className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" /> building…
                </span>
              )}
            </div>
            <pre
              ref={logBox}
              className="max-h-80 overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-gray-200"
            >
              {logs || 'Starting…'}
            </pre>
          </div>
        )}

        {/* Success */}
        {phase === 'live' && liveUrl && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-semibold text-gray-900">🎉 Your app is live!</p>
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all font-medium text-blue-600 underline"
            >
              {liveUrl}
            </a>
            <div className="mt-4 flex gap-3">
              {appId && (
                <Link
                  href="/apps"
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Manage my apps
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

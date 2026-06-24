'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Check, Loader2, Lock, ChevronDown, Rocket, ArrowUpRight } from 'lucide-react'

// "Connect your app" on-ramp: paste a GitHub repo, hit deploy, and watch the
// build happen as clean steps. This is the compute sibling of /publish (static
// sites). The server route /api/apps streams the worker's build logs back as
// plain text; we derive build stages from them and pull the live URL off the
// final FLOWSTAS_RESULT line.

type Phase = 'idle' | 'building' | 'live' | 'error'

export default function DeployPage() {
  const t = useTranslations('deployPage')

  // Stages we show the user, matched against substrings the build engine prints
  // (scripts/deploy-app.mjs emits "▶ Cloning", "▶ Detected Next.js", etc.).
  const STAGES = [
    { label: t('stageCloning'), match: /cloning/i },
    { label: t('stageDetecting'), match: /detected/i },
    { label: t('stagePreparing'), match: /dockerfile|app root|ensuring/i },
    { label: t('stageBuilding'), match: /deploying/i },
  ]

  const [name, setName] = useState('')
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [logs, setLogs] = useState('')
  const [liveUrl, setLiveUrl] = useState<string | null>(null)
  const [appId, setAppId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorLink, setErrorLink] = useState<{ href: string; label: string } | null>(null)
  const logBox = useRef<HTMLPreElement>(null)

  // Which stage we're on: the last one whose marker has appeared in the logs.
  const currentStage = STAGES.reduce((acc, s, i) => (s.match.test(logs) ? i : acc), 0)

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault()
    if (!repo.trim()) {
      setError(t('errNeedRepo'))
      return
    }
    setPhase('building')
    setError(null)
    setErrorLink(null)
    setLogs('')
    setLiveUrl(null)
    setAppId(null)
    setShowLogs(false)

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, repo, branch, githubToken: isPrivate ? githubToken : '' }),
      })

      // Non-streaming error (auth, plan limit, bad repo) comes back as JSON.
      const contentType = res.headers.get('content-type') || ''
      if (!res.ok && contentType.includes('application/json')) {
        const data = await res.json()
        if (data.needsAuth) setErrorLink({ href: '/auth/login', label: t('logIn') })
        else if (data.needsUpgrade) setErrorLink({ href: '/pricing', label: t('viewPlans') })
        throw new Error(data.error || t('errCouldNotStart'))
      }
      if (!res.body) throw new Error(t('errNoOutput'))

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
          }
        }
        setLogs(full.replace(/^FLOWSTAS_APP \w+\n/, '').replace(/FLOWSTAS_RESULT \{.*\}\s*$/, ''))
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
        setError(result?.error || t('errBuildFailed'))
        setShowLogs(true)
      }
    } catch (err) {
      setPhase('error')
      setError(err instanceof Error ? err.message : t('errCouldNotDeploy'))
    }
  }

  const building = phase === 'building'

  return (
    <main className="min-h-screen bg-background bg-grid bg-radial px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary glow-sm">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            {t('subtitle1')}{' '}
            <Link href="/publish" className="font-medium text-primary hover:underline">
              {t('publishLink')}
            </Link>{' '}
            {t('subtitle2')}
          </p>
        </div>

        {/* Form — hidden once we're live so the success card stands alone */}
        {phase !== 'live' && (
          <form onSubmit={handleDeploy} className="glass space-y-5 rounded-2xl p-6 shadow-premium">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t('repoLabel')}
              </label>
              <input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="github.com/your-name/your-app"
                inputMode="url"
                autoComplete="off"
                autoFocus
                disabled={building}
                className="input-modern"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t('repoHelp')}
              </p>
            </div>

            {/* Private repo: keep the scary token field tucked away */}
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                disabled={building}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              {t('privateRepoLabel')}
            </label>
            {isPrivate && (
              <div className="-mt-1">
                <input
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  type="password"
                  placeholder={t('tokenPlaceholder')}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={building}
                  className="input-modern font-mono text-sm"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t('tokenHelp')}
                </p>
              </div>
            )}

            {/* Advanced: name + branch, optional and out of the way */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                />
                {t('optionalSettings')}
              </button>
              {showAdvanced && (
                <div className="mt-3 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      {t('appNameLabel')}
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('appNamePlaceholder')}
                      autoComplete="off"
                      disabled={building}
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      {t('branchLabel')}
                    </label>
                    <input
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                      autoComplete="off"
                      disabled={building}
                      className="input-modern"
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
                {errorLink && (
                  <Link href={errorLink.href} className="ml-2 font-semibold underline">
                    {errorLink.label} →
                  </Link>
                )}
              </div>
            )}

            <button type="submit" disabled={building} className="btn-primary w-full rounded-xl py-4">
              {building ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('buildingApp')}
                </span>
              ) : (
                t('deployCta')
              )}
            </button>
          </form>
        )}

        {/* Build progress — clean steps, raw logs tucked behind a toggle */}
        {(building || (phase === 'error' && logs)) && (
          <div className="mt-6 glass rounded-2xl p-6 shadow-premium">
            <ol className="space-y-3">
              {STAGES.map((stage, i) => {
                const done = i < currentStage || (i === currentStage && !building)
                const active = building && i === currentStage
                return (
                  <li key={stage.label} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        done
                          ? 'bg-primary text-white'
                          : active
                            ? 'bg-primary/15 text-primary'
                            : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : active ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={`text-sm ${done || active ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {stage.label}
                    </span>
                  </li>
                )
              })}
            </ol>

            <button
              type="button"
              onClick={() => setShowLogs((v) => !v)}
              className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showLogs ? 'rotate-180' : ''}`} />
              {showLogs ? t('hideLogs') : t('showLogs')}
            </button>
            {showLogs && (
              <pre
                ref={logBox}
                className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-gray-900 p-4 font-mono text-xs leading-relaxed text-gray-200"
              >
                {logs || t('starting')}
              </pre>
            )}
          </div>
        )}

        {/* Success */}
        {phase === 'live' && liveUrl && (
          <div className="glass rounded-2xl p-8 text-center shadow-premium">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
              <Check className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('liveTitle')} 🎉</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('liveSubtitle')}</p>
            <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl py-4">
              {t('visitApp')} <ArrowUpRight className="h-4 w-4" />
            </a>
            {appId && (
              <Link
                href="/apps"
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-border bg-card py-3 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {t('manageApp')}
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

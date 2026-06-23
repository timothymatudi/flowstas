'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// The EXECUTING agent panel. The user says what they want ("build me a bakery
// site", "host this repo") and the agent does it — writing and publishing a
// site, connecting a domain — asking the user to confirm before any action
// runs. Talks to app/api/assistant/agent/route.ts, which holds the canonical
// Anthropic message array; this component just stores it opaquely and replays it.

const SUGGESTIONS = [
  'Host my site from a GitHub repo',
  'Deploy my app from a repo',
  'Connect my own domain',
  'Which plan do I need?',
]

// What the agent server returns each turn.
type AgentResponse =
  | { kind: 'message'; messages: unknown[]; reply: string }
  | { kind: 'confirm'; messages: unknown[]; action: { id: string; summary: string } }

// One rendered item in the visible transcript.
type View =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'confirm'; id: string; summary: string; status: 'pending' | 'approved' | 'declined' }
  | { kind: 'working' }

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be unavailable (insecure context / denied); fail silently.
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={
        className ??
        'rounded border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary'
      }
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed [&_a]:underline [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const isBlock = /\n/.test(String(children)) || /language-/.test(className ?? '')
            if (!isBlock) {
              return (
                <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[0.85em] text-foreground" {...props}>
                  {children}
                </code>
              )
            }
            const codeText = String(children).replace(/\n$/, '')
            return (
              <span className="relative block">
                <span className="absolute right-2 top-2 z-10">
                  <CopyButton text={codeText} />
                </span>
                <code
                  className="block overflow-x-auto rounded-md bg-gray-900 p-3 pr-16 font-mono text-xs leading-relaxed text-gray-100"
                  {...props}
                >
                  {children}
                </code>
              </span>
            )
          },
          pre({ children }) {
            return <pre className="my-2 overflow-x-auto">{children}</pre>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export function GlobalAssistant() {
  const [apiMessages, setApiMessages] = useState<unknown[]>([])
  const [view, setView] = useState<View[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function post(body: Record<string, unknown>): Promise<AgentResponse> {
    const res = await fetch('/api/assistant/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'The assistant could not respond.')
    return data as AgentResponse
  }

  function apply(data: AgentResponse) {
    setApiMessages(data.messages)
    setView((v) => {
      const base = v.filter((x) => x.kind !== 'working')
      if (data.kind === 'confirm')
        return [...base, { kind: 'confirm', id: data.action.id, summary: data.action.summary, status: 'pending' }]
      return [...base, { kind: 'assistant', text: data.reply || '' }]
    })
  }

  async function ask(question: string) {
    const text = question.trim()
    if (!text || busy) return
    setView((v) => [...v, { kind: 'user', text }, { kind: 'working' }])
    setInput('')
    setBusy(true)
    setError(null)
    try {
      apply(await post({ messages: apiMessages, userText: text }))
    } catch (e) {
      setView((v) => v.filter((x) => x.kind !== 'working'))
      setError(e instanceof Error ? e.message : 'The assistant could not respond.')
    } finally {
      setBusy(false)
    }
  }

  async function decide(id: string, approve: boolean) {
    if (busy) return
    setView((v) => [
      ...v.map((x) => (x.kind === 'confirm' && x.id === id ? { ...x, status: approve ? 'approved' as const : 'declined' as const } : x)),
      { kind: 'working' },
    ])
    setBusy(true)
    setError(null)
    try {
      apply(await post(approve ? { messages: apiMessages, approve: id } : { messages: apiMessages, deny: id }))
    } catch (e) {
      setView((v) => v.filter((x) => x.kind !== 'working'))
      setError(e instanceof Error ? e.message : 'The assistant could not respond.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      {view.length > 0 && (
        <div className="space-y-3">
          {view.map((m, i) => {
            if (m.kind === 'user')
              return (
                <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md gradient-primary px-4 py-2.5 text-sm text-white shadow-premium glow-sm">
                  <div className="whitespace-pre-wrap break-words">{m.text}</div>
                </div>
              )
            if (m.kind === 'working')
              return (
                <div key={i} className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border/60 bg-background/80 px-4 py-3 text-sm text-muted-foreground shadow-premium">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                  </span>
                  Thinking…
                </div>
              )
            if (m.kind === 'confirm')
              return (
                <div key={i} className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3.5 shadow-premium">
                  <p className="text-sm font-medium text-foreground">{m.summary}</p>
                  {m.status === 'pending' ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => decide(m.id, true)}
                        disabled={busy}
                        className="btn-primary rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
                      >
                        Yes, do it
                      </button>
                      <button
                        type="button"
                        onClick={() => decide(m.id, false)}
                        disabled={busy}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-secondary disabled:opacity-50"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs font-medium text-muted-foreground">
                      {m.status === 'approved' ? '✓ Approved' : '✗ Declined'}
                    </p>
                  )}
                </div>
              )
            // assistant
            return (
              <div key={i} className="group mr-auto max-w-[92%] rounded-2xl rounded-bl-md border border-border/60 bg-background/80 px-4 py-3 text-foreground shadow-premium">
                {m.text ? <AssistantMarkdown content={m.text} /> : <div className="text-sm text-muted-foreground">…</div>}
                {m.text && (
                  <div className="mt-2 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                    <CopyButton text={m.text} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {view.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              disabled={busy}
              className="rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
        className="mt-5 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          placeholder="e.g. host github.com/me/my-site, or deploy my app…"
          className="input-modern flex-1"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary rounded-xl px-5 py-2 text-sm disabled:opacity-50">
          {busy ? '…' : 'Send'}
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </section>
  )
}

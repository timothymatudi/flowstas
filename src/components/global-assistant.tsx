'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Platform-wide AI assistant chat panel. Unlike components/app-assistant.tsx
// (scoped to one deployed app), this is self-contained and reachable from the
// dashboard nav, so even a user with no sites or apps can get help. Talks to
// app/api/assistant/route.ts. Replies stream in token-by-token and render as
// markdown.

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'How do I publish a site?',
  'How do I deploy an app?',
  'Why is my app down?',
]

// Small button that copies the given text to the clipboard, showing brief
// "Copied" feedback. Used on assistant messages and inside code blocks.
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be unavailable (insecure context / denied permission);
      // fail silently rather than break the chat.
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={
        className ??
        'rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100'
      }
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// Renders an assistant reply as markdown with readable, scrollable code blocks
// and a per-block copy button.
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
                <code
                  className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[0.85em] text-gray-800"
                  {...props}
                >
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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function ask(question: string) {
    const text = question.trim()
    if (!text || busy) return

    const next = [...messages, { role: 'user' as const, content: text }]
    // Add an empty assistant message we'll stream tokens into.
    setMessages([...next, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'The assistant could not respond.')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        const current = acc
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: current }
          return copy
        })
      }
      acc += decoder.decode()
      if (!acc.trim()) throw new Error('The assistant could not respond.')
      const final = acc.trim()
      setMessages((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: final }
        return copy
      })
    } catch (e) {
      // Drop the in-progress (possibly empty) assistant message on failure.
      setMessages(next)
      setError(e instanceof Error ? e.message : 'The assistant could not respond.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
      <p className="mt-1 text-sm text-gray-500">
        Ask anything about publishing sites or deploying apps — it can see your sites and apps.
      </p>

      {messages.length > 0 && (
        <div className="mt-4 space-y-3">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div
                key={i}
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white"
              >
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
              </div>
            ) : (
              <div
                key={i}
                className="group rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800"
              >
                {m.content ? (
                  <AssistantMarkdown content={m.content} />
                ) : (
                  <div className="text-sm text-gray-400">Thinking…</div>
                )}
                {m.content && (
                  <div className="mt-2 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                    <CopyButton text={m.content} />
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {messages.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              disabled={busy}
              className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
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
        className="mt-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          placeholder="Ask the assistant…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {busy ? '…' : 'Ask'}
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </section>
  )
}

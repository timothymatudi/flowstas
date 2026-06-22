'use client'

import { useState } from 'react'

// Platform-wide AI assistant chat panel. Unlike components/app-assistant.tsx
// (scoped to one deployed app), this is self-contained and reachable from the
// dashboard nav, so even a user with no sites or apps can get help. Talks to
// app/api/assistant/route.ts.

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'How do I publish a site?',
  'How do I deploy an app?',
  'Why is my app down?',
]

export function GlobalAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function ask(question: string) {
    const text = question.trim()
    if (!text || busy) return

    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setInput('')
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'The assistant could not respond.')
      setMessages([...next, { role: 'assistant', content: data.reply }])
    } catch (e) {
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
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === 'user'
                  ? 'rounded-lg bg-gray-900 px-3 py-2 text-sm text-white'
                  : 'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800'
              }
            >
              <div className="whitespace-pre-wrap break-words">{m.content}</div>
            </div>
          ))}
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

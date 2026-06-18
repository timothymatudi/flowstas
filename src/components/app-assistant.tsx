'use client'

import { useState } from 'react'
import type { AppMeta } from '@/lib/app-store'

// AI assistance panel (Track 2, step 10): an embedded Claude assistant that
// reads the app's current state and helps explain build/deploy errors, suggest
// fixes, and write config. Talks to app/api/apps/[id]/assistant/route.ts.

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Why did my last deploy fail?',
  'Write a Dockerfile for this app',
  'What environment variables do I need?',
]

export function AppAssistant({ app }: { app: AppMeta }) {
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
      const res = await fetch(`/api/apps/${app.id}/assistant`, {
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
      <h3 className="text-sm font-semibold text-gray-900">AI assistant</h3>
      <p className="mt-1 text-xs text-gray-500">
        Ask about build errors, fixes, or config — it can see this app&apos;s status and logs.
      </p>

      {messages.length > 0 && (
        <div className="mt-3 space-y-3">
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
        <div className="mt-3 flex flex-wrap gap-2">
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
        className="mt-3 flex gap-2"
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

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getApp, getLatestDeployLog } from '@/lib/app-store'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// AI assistance (Track 2, step 10): a Claude assistant embedded in the app
// dashboard. It reads the app's current state — status, deploy error, repo —
// and helps non-expert founders understand build/deploy failures, suggest
// fixes, and write config (Dockerfile / fly.toml / env). Talks to
// components/app-assistant.tsx.

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function assistantConfigured() {
  return !!process.env.ANTHROPIC_API_KEY
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  const { id } = await params
  const app = await getApp(id, user.id)
  if (!app) return NextResponse.json({ error: 'App not found.' }, { status: 404 })

  // Cost guard: each call is an Opus-4.8 request of up to 16K output tokens, so
  // cap a single user to 20 assistant messages/minute (across all their apps)
  // to stop runaway/scripted spend. Keyed by user, not app, so spinning up apps
  // can't multiply the budget.
  const rl = rateLimit(`assistant:${user.id}`, 20, 60_000)
  if (!rl.ok)
    return NextResponse.json(
      { error: 'You are sending messages too quickly — please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )

  if (!assistantConfigured())
    return NextResponse.json({ error: 'The AI assistant is not configured yet.' }, { status: 503 })

  const body = (await req.json().catch(() => ({}))) as { messages?: ChatMessage[] }
  const history = Array.isArray(body.messages) ? body.messages.slice(-20) : []
  if (history.length === 0 || history[history.length - 1].role !== 'user')
    return NextResponse.json({ error: 'Ask the assistant a question.' }, { status: 400 })

  // Tail the most recent deploy log — it can be up to 100K chars, so keep the
  // last ~8K (where build failures surface) to stay within a sane prompt size.
  const fullLog = await getLatestDeployLog(app.id)
  const logTail = fullLog ? fullLog.slice(-8000) : null

  const context = [
    `App name: ${app.name}`,
    `Repository: ${app.repo}`,
    `Branch: ${app.branch || 'default'}`,
    `Status: ${app.status}`,
    app.url ? `Live URL: ${app.url}` : null,
    app.customDomain ? `Custom domain: ${app.customDomain}` : null,
    app.lastError ? `Most recent deploy error:\n${app.lastError}` : 'No deploy error on record.',
    logTail ? `Tail of the most recent build/deploy log:\n${logTail}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const system = `You are the Flowstas deployment assistant, embedded in the dashboard of a user's deployed app. Flowstas hosts full applications: it clones the user's Git repo, builds a container (generating a Dockerfile when the repo has none), and runs it on Fly.io.

Your job is to help non-expert founders ship. Explain build and deploy errors in plain language, suggest concrete fixes, and write config when asked (Dockerfile, fly.toml, environment variables). Be concise and practical — lead with the likely cause and the next action. When you show config or commands, use fenced code blocks. If you don't have enough information, say what to check rather than guessing.

Here is the current state of this app:
${context}`

  const client = new Anthropic()

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    })
    const message = await stream.finalMessage()
    const reply = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
    return NextResponse.json({ reply })
  } catch (e) {
    if (e instanceof Anthropic.APIError)
      return NextResponse.json(
        { error: `The assistant is unavailable right now (${e.status}).` },
        { status: 502 }
      )
    return NextResponse.json({ error: 'The assistant could not respond.' }, { status: 502 })
  }
}

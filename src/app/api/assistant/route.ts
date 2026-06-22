import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { listApps } from '@/lib/app-store'
import { listSites } from '@/lib/site-store'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Platform-wide AI assistant (not scoped to a single app). The per-app
// assistant (app/api/apps/[id]/assistant/route.ts) only helps once you have a
// deployed app — a brand-new user with nothing published never reaches it. This
// route answers platform-level questions ("how do I deploy?", "why is my app
// down?") with context built from all of the user's sites and apps. Talks to
// components/global-assistant.tsx.

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function assistantConfigured() {
  return !!process.env.ANTHROPIC_API_KEY
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  // Cost guard: each call is an Opus-4.8 request of up to 16K output tokens, so
  // cap a single user to 20 assistant messages/minute to stop runaway/scripted
  // spend. Shares the same key as the per-app assistant so the budget is global.
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

  const [apps, sites] = await Promise.all([listApps(user.id), listSites(user.id)])

  const appsContext =
    apps.length > 0
      ? apps
          .map(
            (a) =>
              `- App "${a.name}" — status: ${a.status}${a.url ? `, URL: ${a.url}` : ''}${
                a.customDomain ? `, custom domain: ${a.customDomain}` : ''
              }${a.lastError ? `, last error: ${a.lastError}` : ''}`
          )
          .join('\n')
      : 'No deployed apps yet.'

  const sitesContext =
    sites.length > 0
      ? sites
          .map(
            (s) =>
              `- Site "${s.name}" — ${s.subdomain}.flowstas.com${
                s.customDomain ? `, custom domain: ${s.customDomain}` : ''
              }`
          )
          .join('\n')
      : 'No published sites yet.'

  const system = `You are the Flowstas assistant, a friendly guide in the user's dashboard. Flowstas is a hosting platform: users can publish static sites (served at <slug>.flowstas.com or their own domain) and deploy full applications, which Flowstas builds into a container and runs on Fly.io.

Your job is to help users publish sites and deploy apps. Answer platform-wide questions in plain language — how to get started, how to publish a site, how to deploy an app, why an app might be down, how to connect a custom domain. Be concise and practical: lead with the next action. Use fenced code blocks for any config or commands. If you don't have enough information, say what to check rather than guessing.

Here are the user's resources:

Apps:
${appsContext}

Sites:
${sitesContext}`

  const client = new Anthropic()

  // Open the stream up front so any immediate API error (auth, bad request) is
  // surfaced as a normal JSON error response before we commit to a 200 stream.
  let stream: ReturnType<typeof client.messages.stream>
  try {
    stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    })
  } catch (e) {
    if (e instanceof Anthropic.APIError)
      return NextResponse.json(
        { error: `The assistant is unavailable right now (${e.status}).` },
        { status: 502 }
      )
    return NextResponse.json({ error: 'The assistant could not respond.' }, { status: 502 })
  }

  // Stream the assistant's text back as it generates so the client can render
  // tokens live instead of waiting for the whole reply.
  const encoder = new TextEncoder()
  const responseBody = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta' &&
            event.delta.text
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      } catch {
        // The stream has already started (status 200), so we can't change the
        // status code; just end it. The client treats a truncated stream that
        // produced no text as an error.
        controller.error(new Error('stream-failed'))
      }
    },
  })

  return new Response(responseBody, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}

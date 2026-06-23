import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { listApps } from '@/lib/app-store'
import { listSites } from '@/lib/site-store'
import { rateLimit } from '@/lib/rate-limit'
import { effectivePlan } from '@/lib/plan-limits'
import { CUSTOM_TOOLS, MUTATING_TOOLS, executeTool, describeAction } from '@/lib/assistant-tools'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// The EXECUTING agent. Unlike the advice-only assistants, this one actually does
// the work for the user — writes and publishes a site, connects a domain — using
// real tools (lib/assistant-tools.ts). It runs a manual agentic loop with
// "ask, then do": read tools run immediately, but any mutating action pauses and
// returns a confirmation for the user to approve before it runs. Web search/fetch
// are Anthropic server-side tools. Talks to components/global-assistant.tsx.

function assistantConfigured() {
  return !!process.env.ANTHROPIC_API_KEY
}

const SYSTEM = `You are the Flowstas agent — you don't just advise, you DO the work for the user. Flowstas is a hosting platform: it publishes static sites (live at <slug>.flowstas.com or the user's own domain) and runs full apps.

How you work:
- Find out what the user wants (a bakery site, a portfolio, "host this repo", etc.). Ask brief clarifying questions ONLY when you genuinely need them (e.g. the business name or vibe). Don't interrogate — sensible defaults are fine.
- When they want a website and don't have files, WRITE a complete, attractive, self-contained HTML document yourself (inline CSS, mobile-friendly, real copy tailored to them, a contact form posting to {{FORM_ACTION}} when relevant) and publish it with publish_site. You can also publish from a template, a URL to snapshot, or a public GitHub repo.
- Take ONE action at a time. After an action runs, tell the user what happened with the live link and offer the next step (connect a domain, tweak the design).
- The platform shows the user a confirmation before any action actually runs, so propose confidently — describe what you'll do, then call the tool.
- You can search the web (web_search) and fetch a shared URL (web_fetch) to answer anything or look up how to do something.
- Be concise and practical. Use fenced code blocks for any commands or config.`

interface AgentRequest {
  messages?: Anthropic.MessageParam[]
  userText?: string
  approve?: string
  deny?: string
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  const rl = rateLimit(`assistant:${user.id}`, 20, 60_000)
  if (!rl.ok)
    return NextResponse.json(
      { error: 'You are sending messages too quickly — please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )

  if (!assistantConfigured())
    return NextResponse.json({ error: 'The AI assistant is not configured yet.' }, { status: 503 })

  const body = (await req.json().catch(() => ({}))) as AgentRequest
  const msgs: Anthropic.MessageParam[] = Array.isArray(body.messages) ? [...body.messages] : []

  // Build the per-request context (effective plan for limit checks, resource list).
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, trial_ends_at')
    .eq('user_id', user.id)
    .maybeSingle()
  const ctx = { userId: user.id, plan: effectivePlan(sub) }

  // Resolve how this turn starts: a new user message, or a decision on a pending
  // action the agent proposed last turn.
  if (body.approve || body.deny) {
    const toolUseId = (body.approve || body.deny) as string
    const last = msgs[msgs.length - 1]
    const block =
      last && last.role === 'assistant' && Array.isArray(last.content)
        ? last.content.find((b) => typeof b === 'object' && b.type === 'tool_use' && b.id === toolUseId)
        : undefined
    if (!block || block.type !== 'tool_use')
      return NextResponse.json({ error: 'That action is no longer pending.' }, { status: 400 })

    let result: Anthropic.ToolResultBlockParam
    if (body.deny) {
      result = {
        type: 'tool_result',
        tool_use_id: toolUseId,
        content: 'The user declined this action. Ask what they would like to change, and do not retry it as-is.',
      }
    } else {
      const outcome = await executeTool(block.name, (block.input ?? {}) as Record<string, unknown>, ctx)
      result = { type: 'tool_result', tool_use_id: toolUseId, content: outcome.content, is_error: !outcome.ok }
    }
    msgs.push({ role: 'user', content: [result] })
  } else if (body.userText && body.userText.trim()) {
    msgs.push({ role: 'user', content: body.userText.trim() })
  } else {
    return NextResponse.json({ error: 'Say what you would like to do.' }, { status: 400 })
  }

  const [apps, sites] = await Promise.all([listApps(user.id), listSites(user.id)])
  const system = `${SYSTEM}

The user's current resources:
Apps: ${apps.length ? apps.map((a) => `"${a.name}" (${a.status})`).join(', ') : 'none yet'}
Sites: ${sites.length ? sites.map((s) => `"${s.name}" @ ${s.subdomain}.flowstas.com`).join(', ') : 'none yet'}`

  const client = new Anthropic()

  // Manual agentic loop. Read tools run inline; the first mutating tool pauses
  // for confirmation. Bounded iterations cap cost.
  try {
    for (let step = 0; step < 8; step++) {
      const message = await client.messages
        .stream({
          model: 'claude-opus-4-8',
          max_tokens: 8000,
          thinking: { type: 'adaptive' },
          output_config: { effort: 'medium' },
          tools: [
            ...CUSTOM_TOOLS,
            // Basic web_search variant on purpose: the _20260209 dynamic-filtering
            // variant runs programmatic tool calling under the hood, which is
            // incompatible with disable_parallel_tool_use (returns 400). The basic
            // variant lets us keep one-action-at-a-time confirmation + web access.
            { type: 'web_search_20250305', name: 'web_search', max_uses: 5 },
          ],
          tool_choice: { type: 'auto', disable_parallel_tool_use: true },
          system,
          messages: msgs,
        })
        .finalMessage()

      msgs.push({ role: 'assistant', content: message.content })

      // Server tools (web_*) ran server-side; if the turn paused on their loop
      // limit, just continue and let it resume.
      if (message.stop_reason === 'pause_turn') continue

      const toolUse = message.content.find((b) => b.type === 'tool_use')
      if (message.stop_reason === 'tool_use' && toolUse && toolUse.type === 'tool_use') {
        // Mutating action → ask the user before doing it.
        if (MUTATING_TOOLS.has(toolUse.name)) {
          const input = (toolUse.input ?? {}) as Record<string, unknown>
          return NextResponse.json({
            kind: 'confirm',
            messages: msgs,
            action: { id: toolUse.id, name: toolUse.name, summary: describeAction(toolUse.name, input) },
          })
        }
        // Read tool → run it now and keep going.
        const outcome = await executeTool(toolUse.name, (toolUse.input ?? {}) as Record<string, unknown>, ctx)
        msgs.push({
          role: 'user',
          content: [
            { type: 'tool_result', tool_use_id: toolUse.id, content: outcome.content, is_error: !outcome.ok },
          ],
        })
        continue
      }

      // Normal end of turn → return the assistant's text.
      const reply = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim()
      return NextResponse.json({ kind: 'message', messages: msgs, reply })
    }
    return NextResponse.json({
      kind: 'message',
      messages: msgs,
      reply: "I've done several steps — tell me how you'd like to continue.",
    })
  } catch (e) {
    if (e instanceof Anthropic.APIError)
      return NextResponse.json(
        { error: `The assistant is unavailable right now (${e.status}).` },
        { status: 502 }
      )
    return NextResponse.json({ error: 'The assistant could not respond.' }, { status: 502 })
  }
}

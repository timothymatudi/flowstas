import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

// Live AI greeting for the homepage intro overlay. The client shows an instant
// local greeting and calls this in the background; if a fresh line comes back in
// time, it swaps in. Returns 503 when no key is set, so the client just keeps
// its local greeting (the intro still works without AI).

type Period = 'morning' | 'afternoon' | 'evening'
const LANGS: Record<string, string> = {
  en: 'English',
  fr: 'French',
  sw: 'Swahili',
  ln: 'Lingala',
}

// Greetings barely change per (lang, period), so cache to avoid an LLM call on
// every single visit. Short TTL keeps them feeling fresh without the cost.
const cache = new Map<string, { line: string; at: number }>()
const TTL = 10 * 60 * 1000 // 10 minutes

export async function GET(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ error: 'not configured' }, { status: 503 })

  const url = new URL(req.url)
  const lang = LANGS[(url.searchParams.get('lang') || 'en').slice(0, 2)] ? (url.searchParams.get('lang') || 'en').slice(0, 2) : 'en'
  const period = (['morning', 'afternoon', 'evening'].includes(url.searchParams.get('period') || '')
    ? url.searchParams.get('period')
    : 'evening') as Period

  const key = `${lang}:${period}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json({ greeting: hit.line })

  const system = `You write a single short welcome line for the entry screen of Flowstas — a platform where anyone can put their website or app online, powered by AI. The line greets a visitor arriving in the ${period}. Write it in ${LANGS[lang]}. Keep it to 4-9 words, warm and a little bold, evoking "the future is here, and it's AI". No quotes, no emoji, no trailing punctuation beyond a period. Output only the line.`

  try {
    const client = new Anthropic()
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 64,
      thinking: { type: 'adaptive' },
      system,
      messages: [{ role: 'user', content: `Write the welcome line in ${LANGS[lang]}.` }],
    })
    const msg = await stream.finalMessage()
    const line = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
      .replace(/^["']|["']$/g, '')
    if (!line) return NextResponse.json({ error: 'empty' }, { status: 502 })
    cache.set(key, { line, at: Date.now() })
    return NextResponse.json({ greeting: line })
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  }
}

import { NextResponse } from 'next/server'
import { createSite } from '@/lib/site-store'

// Publish a new site.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.html !== 'string' || !body.html.trim()) {
    return NextResponse.json({ error: 'Add some HTML for your site first.' }, { status: 400 })
  }
  const meta = await createSite(String(body.name ?? ''), body.html)
  return NextResponse.json({ id: meta.id, url: `/s/${meta.id}` })
}

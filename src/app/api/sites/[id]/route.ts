import { NextResponse } from 'next/server'
import { updateSite, replaceSiteFiles } from '@/lib/site-store'
import { createClient } from '@/lib/supabase/server'
import { parseUpload } from '@/lib/upload-parse'

export const dynamic = 'force-dynamic'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// PATCH: rename a site and/or change its subdomain. JSON { name?, subdomain? }.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Please log in.', needsAuth: true }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || (body.name === undefined && body.subdomain === undefined)) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  const error = await updateSite(id, user.id, {
    name: typeof body.name === 'string' ? body.name : undefined,
    subdomain: typeof body.subdomain === 'string' ? body.subdomain : undefined,
  })
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}

// PUT: replace a site's content (same upload formats as publishing).
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Please log in.', needsAuth: true }, { status: 401 })

  const parsed = await parseUpload(req)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status })

  const error = await replaceSiteFiles(id, user.id, parsed.files)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}

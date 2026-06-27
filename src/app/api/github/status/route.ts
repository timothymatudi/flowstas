import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnection, githubOAuthConfigured, deleteConnection } from '@/lib/github-connection'

export const dynamic = 'force-dynamic'

// GET /api/github/status — is this user connected to GitHub, and as whom?
// Also reports whether the feature is configured server-side at all.
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ connected: false, available: false })

  const available = githubOAuthConfigured()
  const conn = available ? await getConnection(user.id) : null
  return NextResponse.json({
    available,
    connected: Boolean(conn),
    login: conn?.login ?? null,
  })
}

// DELETE /api/github/status — disconnect (forget the stored token).
export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
  await deleteConnection(user.id)
  return NextResponse.json({ ok: true })
}

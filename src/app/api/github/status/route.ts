import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnection, githubOAuthConfigured, deleteConnection } from '@/lib/github-connection'

export const dynamic = 'force-dynamic'

// GET /api/github/status — is this user connected to GitHub, and as whom?
// Also reports whether the feature is configured server-side at all.
export async function GET() {
  // `available` reflects whether the server is configured for GitHub Connect at
  // all — independent of who's asking — so even a logged-out visitor sees the
  // Connect button (clicking it sends them through login, then GitHub).
  const available = githubOAuthConfigured()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const conn = available && user ? await getConnection(user.id) : null
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

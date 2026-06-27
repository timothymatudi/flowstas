import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnectionToken, listRepos } from '@/lib/bitbucket-connection'

export const dynamic = 'force-dynamic'

// GET /api/bitbucket/repos — the connected user's repos (public + private), most
// recently updated first, to populate the deploy picker.
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

  const token = await getConnectionToken(user.id)
  if (!token) return NextResponse.json({ error: 'Bitbucket is not connected.' }, { status: 409 })

  try {
    const repos = await listRepos(token)
    return NextResponse.json({ repos })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not list repositories.' },
      { status: 502 }
    )
  }
}

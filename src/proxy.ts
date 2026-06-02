import { NextResponse } from 'next/server'

export function proxy() {
  // For now, just pass through all requests.
  // Auth protection can be added later when @supabase/ssr is working.
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUFFIX = '.flowstas.com'

// Labels that are the app/marketing host, not a published site, and must never
// be treated as a site subdomain. Keep in sync with RESERVED_SUBDOMAINS in
// lib/site-store.ts.
const RESERVED = new Set([
  'www', 'app', 'api', 'admin', 'dashboard', 'mail', 'ftp', 'blog', 'help',
  'support', 'status', 'docs', 'staging', 'dev', 'test', 'cdn', 'assets',
  'alerts', 'no-reply', 'noreply',
])

// Returns the single-level subdomain label when the host is a published-site
// address like "<slug>.flowstas.com", else null (apex, www, *.vercel.app,
// localhost — all the app itself).
function siteSlugFromHost(host: string): string | null {
  const h = host.split(':')[0].toLowerCase()
  if (!h.endsWith(SUFFIX)) return null
  const label = h.slice(0, -SUFFIX.length)
  if (!label || label.includes('.') || RESERVED.has(label)) return null
  return label
}

export async function proxy(request: NextRequest) {
  // Published-site traffic on a subdomain: serve the site, skip all auth work.
  const slug = siteSlugFromHost(request.headers.get('host') ?? '')
  if (slug) {
    const path = request.nextUrl.pathname
    // Let the form-capture API and framework assets reach their real handlers;
    // everything else is rewritten to the host-based site server.
    if (!path.startsWith('/api/') && !path.startsWith('/_next/')) {
      const url = request.nextUrl.clone()
      url.pathname = `/site-host${path === '/' ? '' : path}`
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // This response object receives any refreshed auth cookies.
  const supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Validate via the Auth server, not just "session from cookies".
  const { data } = await supabase.auth.getUser()
  const user = data?.user ?? null

  const path = request.nextUrl.pathname
  const isProtected = path.startsWith('/dashboard')
  const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/sign-up')

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

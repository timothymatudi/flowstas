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

// True when the Host is a published site — either "<slug>.flowstas.com" or a
// connected custom domain — rather than the app's own hosts (apex, www,
// *.vercel.app, localhost).
function isSiteHost(host: string): boolean {
  const h = host.split(':')[0].toLowerCase()
  if (!h) return false
  if (h === 'flowstas.com' || h === 'www.flowstas.com') return false
  if (h === 'localhost' || h.startsWith('127.') || h.startsWith('192.168.') || h.endsWith('.local')) return false
  if (h.endsWith('.vercel.app')) return false
  if (h.endsWith(SUFFIX)) {
    const label = h.slice(0, -SUFFIX.length)
    return !!label && !label.includes('.') && !RESERVED.has(label)
  }
  // Any other host that resolves here is a connected custom domain → a site.
  return true
}

export async function proxy(request: NextRequest) {
  // Published-site traffic (subdomain or custom domain): serve it, skip auth.
  if (isSiteHost(request.headers.get('host') ?? '')) {
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

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X, Sparkles, LayoutDashboard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { LanguageSwitcher } from '@/components/language-switcher'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // null = auth state not known yet (avoid flashing the wrong buttons), then
  // true/false once Supabase resolves the session.
  const [authed, setAuthed] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setAuthed(!!data.session)
    })
    // Keep the header in sync if the user logs in/out in another tab or via the
    // dashboard, so it never shows "Sign In" to someone who's logged in.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setAuthed(false)
    setMobileMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        {/* Left: logo + nav, grouped together */}
        <div className="flex items-center gap-6 lg:gap-9">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary glow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-2xl gradient-text">Flowstas</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Render the auth buttons only once we know the session, so a logged-in
            user never sees "Sign In" (and vice-versa). */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {authed === true && (
            <>
              <Button asChild className="btn-primary rounded-xl">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          )}
          {authed === false && (
            <>
              <Button variant="ghost" asChild className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild className="btn-primary rounded-xl">
                <Link href="/auth/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card shadow-premium md:hidden transition-all hover:shadow-premium-lg"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="absolute left-0 right-0 top-full border-b border-border glass px-4 py-6 md:hidden shadow-premium-lg">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-3.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
              {authed === true && (
                <>
                  <Button asChild className="w-full btn-primary rounded-xl h-12">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={handleSignOut} className="w-full rounded-xl h-12 btn-secondary">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              )}
              {authed === false && (
                <>
                  <Button variant="outline" asChild className="w-full rounded-xl h-12 btn-secondary">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild className="w-full btn-primary rounded-xl h-12">
                    <Link href="/auth/sign-up">Get started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}

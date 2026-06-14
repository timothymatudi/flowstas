'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
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

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary">
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button asChild className="btn-primary rounded-xl">
            <Link href="/auth/sign-up">Get started</Link>
          </Button>
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
              <Button variant="outline" asChild className="w-full rounded-xl h-12 btn-secondary">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild className="w-full btn-primary rounded-xl h-12">
                <Link href="/auth/sign-up">Get started</Link>
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}

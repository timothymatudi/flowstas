import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">Flowstas</Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/about" className="text-sm font-medium text-foreground transition-colors">About</Link>
            <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Flowstas</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We help businesses of all sizes manage their operations, subscriptions, and growth — all in one place.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Flowstas was built to remove the complexity from running a modern business. We believe powerful tools should be accessible to every team, not just enterprises with large budgets.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">What We Build</h2>
            <p className="text-muted-foreground leading-relaxed">
              From subscription management to real-time analytics, we give you the visibility and control to make better business decisions faster.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { stat: '10,000+', label: 'Businesses using Flowstas' },
            { stat: '$50M+', label: 'Revenue managed on platform' },
            { stat: '99.9%', label: 'Uptime SLA' },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center p-6 rounded-xl border bg-card">
              <div className="text-3xl font-bold mb-2">{stat}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

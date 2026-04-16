import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Zap, Shield, BarChart3, Users, Clock, ArrowRight } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Flowstas
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/sign-up">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Now with AI-powered insights
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance max-w-4xl mx-auto mb-6">
              Streamline Your Business Operations with Flowstas
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
              The all-in-one platform for managing subscriptions, tracking analytics, and growing your business. Start free, scale as you grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link href="/auth/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required. 14-day free trial.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to succeed</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to help businesses of all sizes manage and grow their operations.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6" />}
                title="Advanced Analytics"
                description="Get deep insights into your business performance with real-time dashboards and custom reports."
              />
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title="Team Collaboration"
                description="Invite team members, assign roles, and collaborate seamlessly across your organization."
              />
              <FeatureCard
                icon={<Shield className="h-6 w-6" />}
                title="Enterprise Security"
                description="Bank-level encryption, SOC 2 compliance, and advanced access controls to keep your data safe."
              />
              <FeatureCard
                icon={<Clock className="h-6 w-6" />}
                title="Automated Workflows"
                description="Save time with automated billing, notifications, and custom workflow triggers."
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title="API Integration"
                description="Connect with your favorite tools through our robust API and pre-built integrations."
              />
              <FeatureCard
                icon={<Check className="h-6 w-6" />}
                title="24/7 Support"
                description="Our dedicated support team is available around the clock to help you succeed."
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">10K+</div>
                <p className="text-muted-foreground">Active Users</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">$50M+</div>
                <p className="text-muted-foreground">Processed Monthly</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">99.9%</div>
                <p className="text-muted-foreground">Uptime SLA</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by businesses worldwide</h2>
              <p className="text-lg text-muted-foreground">
                See what our customers have to say about Flowstas.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <TestimonialCard
                quote="Flowstas transformed how we manage our subscriptions. The analytics alone have saved us countless hours."
                author="Sarah Chen"
                role="CEO, TechStart Inc"
              />
              <TestimonialCard
                quote="The best investment we&apos;ve made this year. Setup was easy and the support team is incredible."
                author="Marcus Johnson"
                role="Founder, GrowthLabs"
              />
              <TestimonialCard
                quote="We&apos;ve tried many solutions, but Flowstas is the only one that truly scales with our business needs."
                author="Emily Rodriguez"
                role="COO, ScaleUp Co"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of businesses already using Flowstas to streamline their operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild className="text-base">
                  <Link href="/auth/sign-up">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base border-primary-foreground/20 hover:bg-primary-foreground/10">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-bold mb-4">Flowstas</div>
              <p className="text-sm text-muted-foreground">
                The modern platform for subscription management and business operations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground">Integrations</Link></li>
                <li><Link href="#" className="hover:text-foreground">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            © 2026 Flowstas. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-6">
        <p className="text-muted-foreground mb-4">&quot;{quote}&quot;</p>
        <div>
          <div className="font-semibold">{author}</div>
          <div className="text-sm text-muted-foreground">{role}</div>
        </div>
      </CardContent>
    </Card>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  CreditCard, 
  Globe,
  CheckCircle2,
  Star
} from 'lucide-react'
import { Footer } from '@/components/footer'

// Home page component
export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
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

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-6">
              <Zap className="h-3 w-3 mr-1" />
              Trusted by 10,000+ businesses
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto text-balance">
              Manage your subscriptions and business operations in one place
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
              Flowstas gives you the tools to track subscriptions, analyze performance, and grow your business with powerful insights and automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required. 14-day free trial.
            </p>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-12 border-y bg-muted/30">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-muted-foreground mb-8">
              TRUSTED BY LEADING COMPANIES WORLDWIDE
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
              {['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Wayne Ent'].map((company) => (
                <span key={company} className="text-lg font-semibold text-muted-foreground">
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything you need to manage your business
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                From subscription tracking to advanced analytics, Flowstas has you covered.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6" />}
                title="Real-time Analytics"
                description="Track your key metrics with beautiful dashboards and real-time data visualization."
              />
              <FeatureCard
                icon={<CreditCard className="h-6 w-6" />}
                title="Subscription Management"
                description="Manage all your subscriptions in one place with automated billing and invoicing."
              />
              <FeatureCard
                icon={<Shield className="h-6 w-6" />}
                title="Enterprise Security"
                description="Bank-level encryption and compliance with SOC 2, GDPR, and HIPAA standards."
              />
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title="Team Collaboration"
                description="Invite team members, assign roles, and collaborate seamlessly across your organization."
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title="Automation"
                description="Automate repetitive tasks and workflows to save time and reduce errors."
              />
              <FeatureCard
                icon={<Globe className="h-6 w-6" />}
                title="Global Support"
                description="Multi-currency support and 24/7 customer service for businesses worldwide."
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">10K+</div>
                <div className="text-primary-foreground/70">Active Users</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">$50M+</div>
                <div className="text-primary-foreground/70">Revenue Managed</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">99.9%</div>
                <div className="text-primary-foreground/70">Uptime SLA</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
                <div className="text-primary-foreground/70">Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">Testimonials</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Loved by businesses everywhere
              </h2>
              <p className="text-xl text-muted-foreground">
                See what our customers have to say about Flowstas.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <TestimonialCard
                quote="Flowstas transformed how we manage our subscriptions. The analytics alone have saved us countless hours."
                author="Sarah Chen"
                role="CEO, TechStart"
                rating={5}
              />
              <TestimonialCard
                quote="The best investment we made for our business. Simple, powerful, and the support team is incredible."
                author="Michael Rodriguez"
                role="Founder, GrowthLabs"
                rating={5}
              />
              <TestimonialCard
                quote="We switched from three different tools to just Flowstas. Everything we need in one place."
                author="Emily Watson"
                role="COO, ScaleUp Inc"
                rating={5}
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">How It Works</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Get started in minutes
              </h2>
              <p className="text-xl text-muted-foreground">
                Three simple steps to transform your business operations.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <StepCard
                number="1"
                title="Create your account"
                description="Sign up for free and set up your workspace in under 2 minutes."
              />
              <StepCard
                number="2"
                title="Connect your tools"
                description="Integrate your existing payment providers, CRM, and analytics tools."
              />
              <StepCard
                number="3"
                title="Start growing"
                description="Get insights, automate workflows, and watch your business thrive."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to streamline your business?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of businesses already using Flowstas to manage their operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/auth/sign-up">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">Talk to Sales</Link>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Free 14-day trial
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function TestimonialCard({ quote, author, role, rating }: { quote: string; author: string; role: string; rating: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-1 mb-4">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-muted-foreground mb-4">&ldquo;{quote}&rdquo;</p>
        <div>
          <p className="font-semibold">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

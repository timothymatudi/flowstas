import Link from 'next/link'
import { 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  Globe, 
  Clock,
  Check,
  Star,
  Layers,
  TrendingUp,
  Lock,
  Cpu
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Process thousands of operations per second with our optimized infrastructure.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption and compliance with SOC 2, GDPR, and HIPAA.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Get instant insights with live dashboards and customizable reports.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together seamlessly with role-based access and real-time sync.',
  },
  {
    icon: Globe,
    title: 'Global Scale',
    description: 'Deploy to 50+ regions worldwide with automatic failover.',
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Expert support team available around the clock to help you succeed.',
  },
]

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '99.99%', label: 'Uptime SLA' },
  { value: '150+', label: 'Countries' },
  { value: '5M+', label: 'Tasks/Day' },
]

const testimonials = [
  {
    quote: "Flowstas transformed how we manage our operations. The efficiency gains have been incredible.",
    author: "Sarah Chen",
    role: "CTO, TechCorp",
    avatar: "SC",
  },
  {
    quote: "The best investment we made this year. ROI was visible within the first month.",
    author: "Michael Roberts",
    role: "CEO, GrowthLab",
    avatar: "MR",
  },
  {
    quote: "Finally, a platform that actually delivers on its promises. Exceptional product.",
    author: "Emily Zhang",
    role: "VP Operations, Scale Inc",
    avatar: "EZ",
  },
]

const integrations = [
  'Slack', 'Notion', 'Salesforce', 'HubSpot', 'Jira', 'GitHub', 'Figma', 'Zapier'
]

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-grid bg-radial">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-light mb-8 animate-float">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">1-Day Free Trial - No Credit Card</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
              <span className="text-foreground">The Future of</span>
              <br />
              <span className="gradient-text">Business Operations</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Streamline your workflow, automate repetitive tasks, and scale your business with the most powerful operations platform built for modern teams.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/sign-up" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 group">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/pricing" className="btn-secondary text-lg px-8 py-4 flex items-center gap-2">
                View Pricing
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">4.9/5 from 2,000+ reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 rounded-2xl glass-light">
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-radial-bottom">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="text-sm font-medium text-primary">Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Everything you need to <span className="gradient-text">scale</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful features designed to help you manage, automate, and grow your business operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-light rounded-2xl p-8 card-hover"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6 glow-sm">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="text-sm font-medium text-primary">How It Works</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Get started in <span className="gradient-text">3 simple steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Sign Up', description: 'Create your free account in seconds. No credit card required.', icon: Users },
              { step: '02', title: 'Connect', description: 'Integrate with your existing tools and import your data.', icon: Layers },
              { step: '03', title: 'Scale', description: 'Watch your productivity soar with automated workflows.', icon: TrendingUp },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="glass-light rounded-2xl p-8 text-center card-hover h-full">
                  <div className="text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 glow-sm">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-primary/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="py-24 bg-radial-bottom">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Built for <span className="gradient-text">modern teams</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Large card */}
            <div className="glass-light rounded-2xl p-8 md:col-span-2 md:row-span-2 card-hover flex flex-col justify-between min-h-[400px]">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Advanced Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">Real-time dashboards with AI-powered insights to help you make data-driven decisions faster than ever.</p>
              </div>
              <div className="mt-6 flex gap-2 flex-wrap">
                {['Revenue', 'Users', 'Growth', 'AI Insights'].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-full bg-secondary text-xs text-muted-foreground border border-border">{tag}</span>
                ))}
              </div>
            </div>

            {/* Small cards */}
            <div className="glass-light rounded-2xl p-6 card-hover min-h-[180px] flex flex-col justify-between">
              <Zap className="w-10 h-10 text-primary mb-4" />
              <div>
                <h4 className="font-semibold text-foreground text-lg">Instant Deploy</h4>
                <p className="text-sm text-muted-foreground mt-2">Go live in seconds with one-click deployment</p>
              </div>
            </div>
            <div className="glass-light rounded-2xl p-6 card-hover min-h-[180px] flex flex-col justify-between">
              <Shield className="w-10 h-10 text-primary mb-4" />
              <div>
                <h4 className="font-semibold text-foreground text-lg">Secure by Default</h4>
                <p className="text-sm text-muted-foreground mt-2">Enterprise-grade security built-in</p>
              </div>
            </div>
            <div className="glass-light rounded-2xl p-6 card-hover min-h-[180px] flex flex-col justify-between">
              <Globe className="w-10 h-10 text-primary mb-4" />
              <div>
                <h4 className="font-semibold text-foreground text-lg">Global CDN</h4>
                <p className="text-sm text-muted-foreground mt-2">50+ edge locations worldwide</p>
              </div>
            </div>
            <div className="glass-light rounded-2xl p-6 card-hover min-h-[180px] flex flex-col justify-between">
              <Cpu className="w-10 h-10 text-primary mb-4" />
              <div>
                <h4 className="font-semibold text-foreground text-lg">AI Automation</h4>
                <p className="text-sm text-muted-foreground mt-2">Smart workflows powered by AI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="text-sm font-medium text-primary">Integrations</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Works with your <span className="gradient-text">favorite tools</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Connect Flowstas with the tools you already use. No complex setup required.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {integrations.map((integration) => (
              <div key={integration} className="glass-light rounded-xl px-6 py-4 card-hover">
                <span className="font-medium text-foreground">{integration}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 bg-radial-bottom">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Enterprise Security</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Your data is <span className="gradient-text">safe with us</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                We take security seriously. Your data is encrypted at rest and in transit with industry-leading protocols.
              </p>
              <div className="space-y-4">
                {['SOC 2 Type II Certified', 'GDPR Compliant', 'HIPAA Ready', '256-bit AES Encryption'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-light rounded-3xl p-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl" />
              <div className="relative space-y-6">
                {[
                  { label: 'Data Encryption', value: '100%' },
                  { label: 'Uptime', value: '99.99%' },
                  { label: 'Security Audits', value: 'Monthly' },
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 rounded-xl bg-background/50">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-bold gradient-text">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-radial">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="text-sm font-medium text-primary">Testimonials</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Loved by <span className="gradient-text">thousands</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our customers have to say about Flowstas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass-light rounded-2xl p-8 card-hover">
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-foreground mb-8 leading-relaxed text-lg">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 gradient-primary opacity-90" />
            <div className="absolute inset-0 bg-grid opacity-20" />
            
            <div className="relative p-12 md:p-16 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-8">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Limited Offer</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Start your 1-day free trial
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Experience the full power of Flowstas. No credit card required. Cancel anytime.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <Link 
                  href="/auth/sign-up" 
                  className="bg-white text-gray-900 font-semibold px-8 py-4 rounded-xl hover:bg-white/90 transition-all flex items-center gap-2 group shadow-lg"
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/pricing" 
                  className="bg-white/10 backdrop-blur-sm text-white font-medium px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                >
                  Compare Plans
                </Link>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6 text-white/80 text-sm">
                {['No credit card', 'Cancel anytime', 'Full access', '24/7 support'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-white" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

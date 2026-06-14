import Link from 'next/link'
import {
  ArrowRight,
  Rocket,
  Globe,
  MailCheck,
  MousePointerClick,
  ShieldCheck,
  Server,
  Lock,
  CalendarX,
} from 'lucide-react'

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block mb-4 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold uppercase tracking-wider text-primary">
      {children}
    </span>
  )
}

const trust = [
  { icon: ShieldCheck, title: 'Automatic HTTPS', description: 'Every site is served securely over HTTPS at its own address — nothing to configure.' },
  { icon: Server, title: 'Nothing to manage', description: 'No servers, no DNS, no deploy scripts. You publish; we keep it online.' },
  { icon: Lock, title: 'Your data stays yours', description: 'Your sites and the messages they collect are private to your account.' },
  { icon: CalendarX, title: 'No lock-in', description: 'Plans are billed monthly and you can cancel whenever you like.' },
]

const steps = [
  { step: '01', title: 'Add your site', description: 'Paste your HTML or upload your files.', icon: MousePointerClick },
  { step: '02', title: 'Publish', description: 'One click and your site is live at its own link.', icon: Rocket },
  { step: '03', title: 'Get messages', description: 'Visitors fill your contact form — you receive every message.', icon: MailCheck },
]

const features = [
  { icon: Rocket, title: 'Publish in one click', description: 'Your website goes live instantly — no servers, no setup, no code.' },
  { icon: Globe, title: 'Its own web address', description: 'Every site goes live at its own subdomain like yoursite.flowstas.com — share it with anyone.' },
  { icon: MailCheck, title: 'Capture messages', description: "Your site's contact form saves every message to your dashboard inbox." },
]

const faqs = [
  {
    q: 'What kind of website can I publish?',
    a: 'Any static site. Paste a single HTML page, or upload a whole folder or .zip — HTML, CSS, JavaScript, images and fonts all work.',
  },
  {
    q: 'Where does my site go live?',
    a: 'Every site gets its own address like yoursite.flowstas.com that you can share straight away — no servers to set up and no DNS to configure to get started.',
  },
  {
    q: 'What happens to my contact-form messages?',
    a: 'Every submission is saved and shown in your dashboard, so you never lose an enquiry from a visitor.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Plans are billed monthly and you can cancel whenever you like — no long-term contract.',
  },
]

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative flex items-center pt-16 pb-12 md:pt-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 right-[8%] w-[520px] h-[520px] bg-primary/10 rounded-full blur-[140px]" />
          <div className="absolute top-1/3 -left-24 w-[420px] h-[420px] bg-amber-300/20 rounded-full blur-[130px]" />
        </div>
        <div className="container mx-auto px-4 lg:px-8 py-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card mb-8 border border-border shadow-premium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-sm font-medium text-foreground">Your website, online in seconds</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl mb-7 leading-[1.05]">
              <span className="text-foreground">Publish your website,</span>
              <br />
              <span className="gradient-text">get it live instantly</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Add your small website, hit publish, and it goes live at its own address like{' '}
              <span className="font-semibold text-foreground">yoursite.flowstas.com</span> — no servers, no setup. Your contact form even collects messages for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/publish" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 group">
                Publish a site
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/pricing" className="btn-secondary text-lg px-8 py-4 flex items-center gap-2">
                View Pricing
              </Link>
            </div>

            {/* Browser mockup: a realistic preview of a published site (sample content). */}
            <div className="relative mt-20 max-w-3xl mx-auto">
              <div className="absolute -inset-x-10 -top-10 -bottom-10 bg-gradient-to-tr from-primary/15 via-accent/10 to-transparent blur-3xl -z-10" />
              <div className="absolute -top-3 right-4 sm:right-8 z-20 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-premium border border-border">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                Live
              </div>
              <div className="bg-card rounded-2xl overflow-hidden shadow-premium-lg text-left border border-border">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/60">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="ml-3 flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md bg-background text-sm text-muted-foreground border border-border">
                    <Lock className="w-3.5 h-3.5 text-green-600" />
                    <span className="font-medium text-foreground">yoursite.flowstas.com</span>
                  </div>
                </div>
                {/* Sample published site */}
                <div className="bg-background">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md gradient-primary" />
                      <span className="text-sm font-bold text-foreground">Bella&apos;s Bakery</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Home</span>
                      <span>Menu</span>
                      <span>Contact</span>
                      <span className="px-3 py-1 rounded-full gradient-primary text-white font-medium">Order</span>
                    </div>
                  </div>
                  <div className="px-6 py-8 grid sm:grid-cols-2 gap-6 items-center">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-secondary text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Freshly baked daily
                      </span>
                      <p className="text-2xl font-bold text-foreground leading-tight mb-2">
                        Warm bread, made every morning
                      </p>
                      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                        Handmade loaves, pastries and cakes — baked fresh and ready to collect.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 rounded-lg gradient-primary text-white text-xs font-semibold">See the menu</span>
                        <span className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground">Contact us</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-amber-200 to-orange-300" />
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-rose-200 to-pink-300" />
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-violet-200 to-indigo-300" />
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-emerald-200 to-teal-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-5 text-foreground">
              Live in <span className="gradient-text">3 simple steps</span>
            </h2>
            <p className="text-lg text-muted-foreground">From your files to a live website in under a minute.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item, index) => (
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

      {/* Features */}
      <section id="features" className="py-24 bg-radial-bottom">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Eyebrow>Features</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-5 text-foreground">
              Everything you need to <span className="gradient-text">go live</span>
            </h2>
            <p className="text-lg text-muted-foreground">No code, no servers — just the essentials, done well.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="glass-light rounded-2xl p-8 card-hover">
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

      {/* Why trust Flowstas */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Eyebrow>Why Flowstas</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-5 text-foreground">
              Built to be <span className="gradient-text">dependable</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trust.map((item, index) => (
              <div key={index} className="glass-light rounded-2xl p-6 card-hover">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-5 glow-sm">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-5 text-foreground">
              Questions, <span className="gradient-text">answered</span>
            </h2>
          </div>
          <div className="max-w-3xl mx-auto grid gap-4">
            {faqs.map((item, index) => (
              <div key={index} className="glass-light rounded-2xl p-6 md:p-8">
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.q}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 gradient-primary opacity-90" />
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="relative p-12 md:p-16 text-center">
              <h2 className="font-display text-4xl md:text-5xl mb-6 text-white">
                Put your site online today
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Add your website and share a live link in under a minute.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/publish" className="bg-white text-gray-900 font-semibold px-8 py-4 rounded-xl hover:bg-white/90 transition-all flex items-center gap-2 group shadow-lg">
                  Publish a site
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/pricing" className="bg-white/10 backdrop-blur-sm text-white font-medium px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

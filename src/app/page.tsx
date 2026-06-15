import Link from 'next/link'
import Image from 'next/image'
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
  Check,
  Link2,
  BarChart3,
} from 'lucide-react'
import { HeroPublish } from '@/components/hero-publish'

const examples = [
  { img: '/examples/sunrise-bakery.png', name: 'Sunrise Bakery', kind: 'Local bakery', host: 'sunrise-bakery.flowstas.com' },
  { img: '/examples/atlas-fitness.png', name: 'Atlas Fitness', kind: 'Fitness studio', host: 'atlas-fitness.flowstas.com' },
  { img: '/examples/lumen-studio.png', name: 'Lumen Studio', kind: 'Design studio', host: 'lumen-studio.flowstas.com' },
]

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block mb-4 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold uppercase tracking-wider text-primary">
      {children}
    </span>
  )
}

const trust = [
  { icon: ShieldCheck, tint: 'bg-primary/10 text-primary', title: 'Automatic HTTPS', description: 'Every site is served securely over HTTPS at its own address — nothing to configure.' },
  { icon: Server, tint: 'bg-primary/10 text-primary', title: 'Nothing to manage', description: 'No servers, no DNS, no deploy scripts. You publish; we keep it online.' },
  { icon: Lock, tint: 'bg-primary/10 text-primary', title: 'Your data stays yours', description: 'Your sites and the messages they collect are private to your account.' },
  { icon: CalendarX, tint: 'bg-primary/10 text-primary', title: 'No lock-in', description: 'Plans are billed monthly and you can cancel whenever you like.' },
]

const steps = [
  { step: '01', title: 'Add your site', description: 'Paste your HTML or upload your files.', icon: MousePointerClick },
  { step: '02', title: 'Publish', description: 'One click and your site is live at its own link.', icon: Rocket },
  { step: '03', title: 'Get messages', description: 'Visitors fill your contact form — you receive every message.', icon: MailCheck },
]

const features = [
  { icon: Rocket, tint: 'bg-primary/10 text-primary', title: 'Publish in one click', description: 'Paste your HTML or drop a folder/zip. Your site is online in about 20 seconds — no servers, no code.' },
  { icon: Globe, tint: 'bg-primary/10 text-primary', title: 'Its own web address', description: 'Every site goes live at its own subdomain like yoursite.flowstas.com, with HTTPS on by default.' },
  { icon: Link2, tint: 'bg-primary/10 text-primary', title: 'Connect your own domain', description: 'Point www.yourbusiness.com at your site and we handle the HTTPS certificate automatically.' },
  { icon: MailCheck, tint: 'bg-primary/10 text-primary', title: 'Capture messages', description: 'Your contact form saves every enquiry to your dashboard and emails you the moment one arrives.' },
  { icon: BarChart3, tint: 'bg-primary/10 text-primary', title: 'See your visitors', description: 'A simple view count per site in your dashboard, so you know what people are looking at.' },
  { icon: Lock, tint: 'bg-primary/10 text-primary', title: 'Password-protect it', description: 'Put a password on any site for client previews, drafts or private pages.' },
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
        <div className="absolute inset-0 hero-mesh pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 py-12 relative z-10">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-12 items-center">
            {/* Left: the pitch */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card mb-7 border border-border shadow-premium">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="text-sm font-medium text-foreground">Your website, online in seconds</span>
              </div>
              <h1 className="font-display text-5xl md:text-6xl xl:text-7xl mb-6 leading-[1.04]">
                <span className="text-foreground">Publish your website, </span>
                <span className="gradient-text">get it live instantly.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-7 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                No servers, no setup, no code. Paste your site or drop a zip — it goes live at its
                own <span className="font-semibold text-foreground">yoursite.flowstas.com</span>,
                contact form and all.
              </p>
              <ul className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2.5 text-sm text-muted-foreground">
                {['Live in seconds', 'Automatic HTTPS', 'Free to start'].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-green-600" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: the real tool */}
            <div className="relative">
              <HeroPublish />
            </div>
          </div>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Prefer a bigger editor or to upload a whole folder?{' '}
            <Link href="/publish" className="font-medium text-primary hover:underline">Open the full publish page</Link>
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Real example sites */}
      <section className="py-20 border-y border-border bg-secondary/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Eyebrow>Real sites</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-4 text-foreground">
              Built &amp; published <span className="gradient-text">on Flowstas</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Three real sites, live right now — each at its own flowstas.com address. Tap any to open it.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {examples.map((e) => (
              <a
                key={e.host}
                href={`https://${e.host}`}
                target="_blank"
                rel="noreferrer"
                className="glass-light rounded-2xl overflow-hidden card-hover block"
              >
                <div className="flex items-center gap-1.5 border-b border-border bg-secondary/70 px-3 py-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 truncate text-xs text-muted-foreground">{e.host}</span>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={e.img}
                    alt={`${e.name} — a real site published on Flowstas`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-foreground">{e.name}</p>
                    <p className="text-sm text-muted-foreground">{e.kind}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Visit <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
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
          <div className="grid md:grid-cols-3 gap-10 md:gap-8 max-w-5xl mx-auto">
            {steps.map((item, index) => (
              <div key={index} className="relative text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="font-display text-5xl text-primary/35">{item.step}</span>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground">
                    <item.icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
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
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.tint}`}>
                  <feature.icon className="w-7 h-7" />
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
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${item.tint}`}>
                  <item.icon className="w-6 h-6" />
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

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
  { step: '01', title: 'Bring it', description: 'Paste a site, upload files, import a URL, or connect a Git repo.', icon: MousePointerClick },
  { step: '02', title: 'We put it live', description: 'We host your site or build & run your app — with HTTPS.', icon: Rocket },
  { step: '03', title: 'Go', description: 'Connect your own domain, or share the free flowstas.com address you get to start.', icon: Globe },
]

const features = [
  { icon: Rocket, tint: 'bg-primary/10 text-primary', title: 'Publish in one click', description: 'Paste your HTML or drop a folder/zip. Your site is online in seconds — no servers, no code.', href: '/publish' },
  { icon: Globe, tint: 'bg-primary/10 text-primary', title: 'A free address to start', description: 'No domain yet? Get a free flowstas.com address to share right away — and connect your own domain anytime, with HTTPS on by default.', href: '/publish' },
  { icon: Link2, tint: 'bg-primary/10 text-primary', title: 'Use your own domain', description: 'Put your site on your own brand — point yourbusiness.com at it and we handle the HTTPS certificate automatically.', href: '/publish' },
  { icon: MailCheck, tint: 'bg-primary/10 text-primary', title: 'Capture messages', description: 'Your contact form saves every enquiry to your dashboard and emails you the moment one arrives.', href: '/publish' },
  { icon: BarChart3, tint: 'bg-primary/10 text-primary', title: 'See your visitors', description: 'A simple view count per site in your dashboard, so you know what people are looking at.', href: '/publish' },
  { icon: Lock, tint: 'bg-primary/10 text-primary', title: 'Password-protect it', description: 'Put a password on any site for client previews, drafts or private pages.', href: '/publish' },
  { icon: Server, tint: 'bg-primary/10 text-primary', title: 'Deploy full apps too', description: 'Connect a GitHub, GitLab or Bitbucket repo — Next.js, Astro, SvelteKit, Nuxt, Vite/React, plain Node or your own Dockerfile — and we build and run it live.', href: '/deploy' },
]

const faqs = [
  {
    q: 'What kind of website can I publish?',
    a: 'Any static site. Paste a single HTML page, or upload a whole folder or .zip — HTML, CSS, JavaScript, images and fonts all work.',
  },
  {
    q: 'Can I host a full app, not just a static site?',
    a: 'Yes. Use “Deploy an app” to connect a GitHub, GitLab or Bitbucket repo and we build and run it for you — Next.js, Astro, SvelteKit, Nuxt, Vite/React, plain Node, or any repo with its own Dockerfile.',
  },
  {
    q: 'Where does my site go live?',
    a: 'Connect your own domain (like yourbusiness.com) and we serve it over HTTPS automatically — no DNS hassle. Don’t have one yet? You also get a free flowstas.com address to share right away.',
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
                <span className="text-sm font-medium text-foreground">Host a site or deploy an app</span>
              </div>
              <h1 className="font-display text-6xl md:text-7xl xl:text-8xl mb-6 leading-[0.95] tracking-tight">
                <span className="text-foreground">Host your site. </span>
                <span className="gradient-text">Deploy your app.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-7 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Bring what you already have — paste a site, drop a zip, import a URL, or point us at a
                <span className="font-semibold text-foreground"> GitHub, GitLab or Bitbucket</span> repo. We host or
                build it and put it live with HTTPS at your own address.
              </p>
              <ul className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2.5 text-sm text-muted-foreground">
                {['Static or full-stack', 'Automatic HTTPS', 'Free to start'].map((t) => (
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
            Want to upload a folder, import a URL, or{' '}
            <Link href="/deploy" className="font-medium text-primary hover:underline">deploy a full app from a repo</Link>?{' '}
            <Link href="/publish" className="font-medium text-primary hover:underline">Open the publish page</Link>.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Two ways to ship */}
      <section className="py-20 border-y border-border bg-secondary/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Eyebrow>What you can ship</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-4 text-foreground">
              Two ways to <span className="gradient-text">go live</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Host a static site, or deploy a full app from a repo — same one-click feel.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Host a site — browser frame */}
            <div className="glass-light rounded-2xl p-6 card-hover">
              <div className="rounded-xl overflow-hidden border border-border shadow-premium">
                <div className="flex items-center gap-1.5 bg-secondary/70 px-3 py-2.5 border-b border-border">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs text-muted-foreground">yourname.flowstas.com</span>
                </div>
                <div className="bg-background h-44 p-6 flex flex-col items-center justify-center text-center">
                  <div className="h-3.5 w-40 rounded bg-foreground/80 mb-3" />
                  <div className="h-2 w-52 rounded bg-muted-foreground/30 mb-1.5" />
                  <div className="h-2 w-44 rounded bg-muted-foreground/30 mb-5" />
                  <div className="h-8 w-28 rounded-lg gradient-primary" />
                </div>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-foreground">Host a site</h3>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                Paste HTML, drop a zip, or import a URL — live at your own address with HTTPS in seconds.
              </p>
            </div>

            {/* Deploy an app — live build log */}
            <div className="glass-light rounded-2xl p-6 card-hover">
              <div className="rounded-xl overflow-hidden border border-border shadow-premium">
                <div className="flex items-center gap-1.5 bg-gray-900 px-3 py-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs text-gray-400">building your app…</span>
                </div>
                <div className="bg-gray-950 h-44 p-4 font-mono text-xs leading-relaxed text-gray-300 space-y-1">
                  <p><span className="text-green-400">▸</span> Cloning your repo…</p>
                  <p><span className="text-green-400">▸</span> Detected Next.js</p>
                  <p><span className="text-green-400">▸</span> Building the container…</p>
                  <p><span className="text-green-400">▸</span> Deploying…</p>
                  <p className="text-green-400">✓ Live at yourapp.flowstas.com</p>
                </div>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-foreground">Deploy an app</h3>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                Point us at a GitHub, GitLab or Bitbucket repo — we build the container and run it live.
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Real sites running on Flowstas:{' '}
            {examples.map((e, i) => (
              <span key={e.host}>
                <a href={`https://${e.host}`} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                  {e.host}
                </a>
                {i < examples.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
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
            <p className="text-lg text-muted-foreground">From your files or repo to a live site or app — in minutes.</p>
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
              <Link
                key={index}
                href={feature.href}
                className="group glass-light rounded-2xl p-8 card-hover block"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.tint} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  Learn more <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
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
          <div className="relative rounded-[2rem] overflow-hidden shadow-premium-lg">
            {/* layered, cooked background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#16207a] via-[#2647e8] to-[#00a3c4]" />
            <div className="absolute inset-0 bg-grid opacity-[0.12]" />
            <div className="absolute -top-28 -left-20 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
            <div className="absolute -bottom-28 -right-12 h-80 w-80 rounded-full bg-indigo-400/30 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
            <div className="relative px-8 py-16 md:py-20 text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-wider mb-7">
                <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" /> Live in under a minute
              </span>
              <h2 className="font-display text-4xl md:text-6xl mb-5 text-white tracking-tight leading-[1.0]">
                Put it online today
              </h2>
              <p className="text-lg md:text-xl text-white/75 mb-10 max-w-2xl mx-auto">
                Bring your site or your repo — share a live link in under a minute.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/publish"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-[#16207a] shadow-[0_10px_30px_-6px_rgba(255,255,255,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-6px_rgba(255,255,255,0.65)]"
                >
                  Publish a site
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/deploy"
                  className="rounded-xl border border-white/25 bg-white/10 px-8 py-4 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Deploy an app
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

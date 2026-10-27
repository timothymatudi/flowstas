import Link from 'next/link'
import { useTranslations } from 'next-intl'
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

export default function HomePage() {
  const t = useTranslations('landing')

  const trust = [
    { icon: ShieldCheck, tint: 'bg-primary/10 text-primary', title: t('trust1Title'), description: t('trust1Desc') },
    { icon: Server,      tint: 'bg-primary/10 text-primary', title: t('trust2Title'), description: t('trust2Desc') },
    { icon: Lock,        tint: 'bg-primary/10 text-primary', title: t('trust3Title'), description: t('trust3Desc') },
    { icon: CalendarX,   tint: 'bg-primary/10 text-primary', title: t('trust4Title'), description: t('trust4Desc') },
  ]

  const steps = [
    { step: '01', title: t('step1Title'), description: t('step1Desc'), icon: MousePointerClick },
    { step: '02', title: t('step2Title'), description: t('step2Desc'), icon: Rocket },
    { step: '03', title: t('step3Title'), description: t('step3Desc'), icon: Globe },
  ]

  const features = [
    { icon: Rocket,     href: '/publish',  tint: 'bg-primary/10 text-primary', title: t('feat1Title'), description: t('feat1Desc') },
    { icon: Globe,      href: '/publish',  tint: 'bg-primary/10 text-primary', title: t('feat2Title'), description: t('feat2Desc') },
    { icon: Link2,      href: '/publish',  tint: 'bg-primary/10 text-primary', title: t('feat3Title'), description: t('feat3Desc') },
    { icon: MailCheck,  href: '/messages', tint: 'bg-primary/10 text-primary', title: t('feat4Title'), description: t('feat4Desc') },
    { icon: BarChart3,  href: '/visitors', tint: 'bg-primary/10 text-primary', title: t('feat5Title'), description: t('feat5Desc') },
    { icon: Lock,       href: '/passwords',tint: 'bg-primary/10 text-primary', title: t('feat6Title'), description: t('feat6Desc') },
    { icon: Server,     href: '/deploy',   tint: 'bg-primary/10 text-primary', title: t('feat7Title'), description: t('feat7Desc') },
  ]

  const faqs = [
    { q: t('faq1q'), a: t('faq1a') },
    { q: t('faq2q'), a: t('faq2a') },
    { q: t('faq3q'), a: t('faq3a') },
    { q: t('faq4q'), a: t('faq4a') },
    { q: t('faq5q'), a: t('faq5a') },
  ]

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
                <span className="text-sm font-medium text-foreground">{t('badge')}</span>
              </div>
              <h1 className="font-display text-6xl md:text-7xl xl:text-8xl mb-6 leading-[0.95] tracking-tight">
                <span className="text-foreground">{t('headlineLine1')} </span>
                <span className="gradient-text">{t('headlineLine2')}</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-7 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('subheadlineDetail')}
              </p>
              <ul className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2.5 text-sm text-muted-foreground">
                {([t('pill1'), t('pill2'), t('pill3')] as string[]).map((pill) => (
                  <li key={pill} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-green-600" /> {pill}
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
            {t('heroCta')}{' '}
            <Link href="/deploy" className="font-medium text-primary hover:underline">{t('heroCtaDeployLink')}</Link>
            {t('heroCtaMid')}
            <Link href="/publish" className="font-medium text-primary hover:underline">{t('heroCtaPublishLink')}</Link>
            {t('heroCtaSuffix')}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Two ways to ship */}
      <section className="py-20 border-y border-border bg-secondary/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Eyebrow>{t('twoWaysEyebrow')}</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-4 text-foreground">
              {t('twoWaysTitle1')} <span className="gradient-text">{t('twoWaysTitle2')}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('twoWaysSubtitle')}
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
                  <span className="ml-2 text-xs text-muted-foreground">yourname.com</span>
                </div>
                <div className="bg-background h-44 p-6 flex flex-col items-center justify-center text-center">
                  <div className="h-3.5 w-40 rounded bg-foreground/80 mb-3" />
                  <div className="h-2 w-52 rounded bg-muted-foreground/30 mb-1.5" />
                  <div className="h-2 w-44 rounded bg-muted-foreground/30 mb-5" />
                  <div className="h-8 w-28 rounded-lg gradient-primary" />
                </div>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-foreground">{t('siteCardTitle')}</h3>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                {t('siteCardDesc')}
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
                  <p className="text-green-400">✓ Live at yourapp.com</p>
                  <p className="text-gray-500">  or yourapp.flowstas.com</p>
                </div>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-foreground">{t('appCardTitle')}</h3>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                {t('appCardDesc')}
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t('realSites')}{' '}
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
            <Eyebrow>{t('howEyebrow')}</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-5 text-foreground">
              {t('howTitle1')} <span className="gradient-text">{t('howTitle2')}</span>
            </h2>
            <p className="text-lg text-muted-foreground">{t('subheadline')}</p>
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
            <Eyebrow>{t('featEyebrow')}</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-5 text-foreground">
              {t('featTitle1')} <span className="gradient-text">{t('featTitle2')}</span>
            </h2>
            <p className="text-lg text-muted-foreground">{t('featSubtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="group glass-light rounded-2xl p-8 card-hover block focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.tint} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why trust Flowstas */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Eyebrow>{t('trustEyebrow')}</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-5 text-foreground">
              {t('trustTitle1')} <span className="gradient-text">{t('trustTitle2')}</span>
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
            <Eyebrow>{t('faqEyebrow')}</Eyebrow>
            <h2 className="font-display text-4xl md:text-5xl mb-5 text-foreground">
              {t('faqTitle1')} <span className="gradient-text">{t('faqTitle2')}</span>
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
                <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" /> {t('ctaBadge')}
              </span>
              <h2 className="font-display text-4xl md:text-6xl mb-5 text-white tracking-tight leading-[1.0]">
                {t('ctaTitle')}
              </h2>
              <p className="text-lg md:text-xl text-white/75 mb-10 max-w-2xl mx-auto">
                {t('ctaSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/publish"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-[#16207a] shadow-[0_10px_30px_-6px_rgba(255,255,255,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-6px_rgba(255,255,255,0.65)]"
                >
                  {t('ctaPublishBtn')}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/deploy"
                  className="rounded-xl border border-white/25 bg-white/10 px-8 py-4 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  {t('ctaDeployBtn')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

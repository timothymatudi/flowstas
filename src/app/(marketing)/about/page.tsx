import { useTranslations } from 'next-intl'
import { Users, Target, Award, TrendingUp } from 'lucide-react'

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block mb-5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold uppercase tracking-wider text-primary">
      {children}
    </span>
  )
}

const valueIcons = [Users, Target, Award, TrendingUp]

export default function AboutPage() {
  const t = useTranslations('about')
  const stats = [
    { value: t('s1v'), label: t('s1l') },
    { value: t('s2v'), label: t('s2l') },
    { value: t('s3v'), label: t('s3l') },
    { value: t('s4v'), label: t('s4l') },
  ]
  const values = valueIcons.map((icon, i) => ({
    icon,
    title: t(`v${i + 1}t`),
    description: t(`v${i + 1}d`),
  }))
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 pb-16 pt-24 lg:pb-24 lg:pt-32">
        <div className="absolute inset-0 hero-mesh pointer-events-none -z-10" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>{t('eyebrow')}</Eyebrow>
            <h1 className="font-display text-balance text-5xl leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
              <span className="text-foreground">{t('titleA')}</span>
              <span className="gradient-text">{t('titleB')}</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              {t('subtitle')}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Stats */}
      <section className="border-b border-border/40 bg-secondary/40 py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="card-hover rounded-2xl border border-border/60 bg-background p-6 text-center shadow-premium">
                <p className="font-display text-xl font-bold text-foreground md:text-2xl">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t('storyTitle')}</h2>
            <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>{t('story1')}</p>
              <p>{t('story2')}</p>
              <p>{t('story3')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border/40 bg-secondary/40 py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>{t('valuesEyebrow')}</Eyebrow>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t('valuesTitle')}</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('valuesSubtitle')}
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.title}
                className="card-hover rounded-2xl border border-border/60 bg-background p-8 shadow-premium"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">{value.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

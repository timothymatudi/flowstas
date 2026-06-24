import { useTranslations } from 'next-intl'

export default function PrivacyPage() {
  const t = useTranslations('privacyPage')
  const sections = [
    { heading: t('s1Heading'), body: t('s1Body') },
    { heading: t('s2Heading'), body: t('s2Body') },
    { heading: t('s3Heading'), body: t('s3Body') },
    { heading: t('s4Heading'), body: t('s4Body') },
  ]
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 pb-12 pt-24 lg:pb-16 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent via-background to-background" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 text-muted-foreground">{t('lastUpdated')}</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-12">
              {sections.map((section, i) => (
                <div key={i} className="rounded-2xl border border-border/60 bg-card p-8 shadow-premium">
                  <h2 className="mb-4 text-xl font-semibold text-foreground">{section.heading}</h2>
                  <p className="leading-relaxed text-muted-foreground">{section.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

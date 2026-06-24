import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Mail, ArrowRight } from 'lucide-react'

export default function SignUpSuccessPage() {
  const t = useTranslations('authSignupSuccess')
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background bg-grid px-4">
      <div className="absolute inset-0 hero-mesh pointer-events-none" />
      <div className="relative z-10 w-full max-w-md text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8 glow">
          <Mail className="w-10 h-10 text-white" />
        </div>

        <h1 className="font-display text-3xl text-foreground mb-4">{t('title')}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {t('description')}
        </p>

        <div className="glass rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-2">{t('whatsNext')}</h3>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">1.</span>
              {t('step1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">2.</span>
              {t('step2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">3.</span>
              {t('step3')}
            </li>
          </ul>
        </div>

        <Link
          href="/auth/login"
          className="btn-secondary inline-flex items-center gap-2"
        >
          {t('goToLogin')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { XCircle, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export default function CancelPage() {
  const t = useTranslations('cancelPage')
  return (
    <main className="flex min-h-screen items-center justify-center py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted shadow-premium">
              <XCircle className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
            {t('description')}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-12 rounded-xl px-8 shadow-premium">
              <Link href="/pricing">
                {t('tryAgain')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="h-12 rounded-xl px-8">
              <Link href="/contact">{t('contactSupport')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

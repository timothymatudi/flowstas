'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export const CONSENT_COOKIE = 'FLOWSTAS_COOKIE_CONSENT'

function getConsent(): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]+)`))
  return m ? decodeURIComponent(m[1]) : null
}

// GDPR-style consent banner. Non-essential analytics only load after the
// visitor accepts (the server reads this cookie to decide whether to mount
// <Analytics />). Essential cookies — auth, language, currency — always run.
export function CookieConsent() {
  const t = useTranslations('cookies')
  const router = useRouter()
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(getConsent() == null)
  }, [])

  function choose(value: 'accepted' | 'rejected') {
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    setShow(false)
    // Re-render so the server mounts/skips analytics based on the new choice.
    router.refresh()
  }

  if (!show) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border bg-card p-4 shadow-premium-lg sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t('message')}{' '}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            {t('learnMore')}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => choose('rejected')}
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            {t('reject')}
          </button>
          <button
            onClick={() => choose('accepted')}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  )
}

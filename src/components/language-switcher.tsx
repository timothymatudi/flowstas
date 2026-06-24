'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { locales, localeMeta } from '@/i18n/locales'
import { setLocaleAction } from '@/app/actions/locale'

// A small dropdown that switches the UI language. Sets a cookie via a server
// action, then refreshes so the new language renders.
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const active = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    startTransition(async () => {
      await setLocaleAction(next)
      router.refresh()
    })
  }

  return (
    <label className={`inline-flex items-center gap-1.5 text-sm ${className}`}>
      <Globe className="h-4 w-4 opacity-70" aria-hidden />
      <span className="sr-only">{localeMeta[active as keyof typeof localeMeta]?.label ?? 'Language'}</span>
      <select
        value={active}
        onChange={onChange}
        disabled={isPending}
        aria-label="Language"
        className="cursor-pointer rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-primary disabled:opacity-50"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeMeta[l].label}
          </option>
        ))}
      </select>
    </label>
  )
}

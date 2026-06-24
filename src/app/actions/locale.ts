'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { LOCALE_COOKIE } from '@/i18n/request'
import { isLocale } from '@/i18n/locales'

// Persist the visitor's language choice in a cookie (read by i18n/request.ts).
export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return
  const store = await cookies()
  store.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })
  revalidatePath('/', 'layout')
}

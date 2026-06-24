import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, isLocale } from './locales'

// i18n without URL routing: the active locale is read from a cookie that the
// language switcher sets. Falls back to English when unset/invalid.
export const LOCALE_COOKIE = 'FLOWSTAS_LOCALE'

export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get(LOCALE_COOKIE)?.value
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})

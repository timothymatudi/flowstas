import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { cookies, headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import { Toaster } from '@/components/ui/sonner'
import { localeMeta, ogLocale, type Locale } from '@/i18n/locales'
import { CurrencyProvider, CURRENCY_COOKIE } from '@/components/currency-provider'
import { currencyForCountry, isCurrency } from '@/lib/currency'
import { CookieConsent, CONSENT_COOKIE } from '@/components/cookie-consent'
import './globals.css'

// Localized SEO: title/description and og:locale follow the visitor's language.
export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations('seo')
  const title = t('title')
  const description = t('description')
  return {
    metadataBase: new URL('https://flowstas.com'),
    title: { default: title, template: '%s | Flowstas' },
    description,
    keywords: [
      'website hosting',
      'publish a website',
      'static site hosting',
      'website builder',
      'contact form',
      'small business website',
    ],
    applicationName: 'Flowstas',
    authors: [{ name: 'Flowstas' }],
    generator: 'v0.app',
    openGraph: {
      type: 'website',
      url: 'https://flowstas.com',
      siteName: 'Flowstas',
      title,
      description,
      locale: ogLocale[locale] ?? 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = (await getLocale()) as Locale
  const dir = localeMeta[locale]?.dir ?? 'ltr'

  // Initial display currency: the visitor's saved choice, else inferred from
  // their country (geo header), else the default.
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const savedCurrency = cookieStore.get(CURRENCY_COOKIE)?.value
  const initialCurrency =
    savedCurrency && isCurrency(savedCurrency)
      ? savedCurrency
      : currencyForCountry(headerStore.get('x-vercel-ip-country'))

  // GDPR: only load non-essential analytics once the visitor has accepted.
  const analyticsAllowed = cookieStore.get(CONSENT_COOKIE)?.value === 'accepted'

  return (
    // suppressHydrationWarning: the bootstrap script mutates <html>'s class
    // before hydration, which is an intentional, expected SSR/client mismatch.
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <NextIntlClientProvider>
          <CurrencyProvider initialCurrency={initialCurrency}>
            {children}
            <Toaster />
            <CookieConsent />
            {analyticsAllowed && <Analytics />}
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

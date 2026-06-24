import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { Toaster } from '@/components/ui/sonner'
import { localeMeta, type Locale } from '@/i18n/locales'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://flowstas.com'),
  title: {
    default: 'Flowstas | Publish your website in seconds',
    template: '%s | Flowstas',
  },
  description: 'Publish your website in seconds — paste HTML or drop a zip and it goes live at its own address with HTTPS, a contact form, and your own custom domain. No servers, no setup.',
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
    title: 'Flowstas | Publish your website in seconds',
    description: 'Paste HTML or drop a zip and your site is live — its own address, HTTPS, a contact form, and your own custom domain.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flowstas | Publish your website in seconds',
    description: 'Publish your website in seconds and collect messages from visitors.',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = (await getLocale()) as Locale
  const dir = localeMeta[locale]?.dir ?? 'ltr'
  return (
    // suppressHydrationWarning: the bootstrap script mutates <html>'s class
    // before hydration, which is an intentional, expected SSR/client mismatch.
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <NextIntlClientProvider>
          {children}
          <Toaster />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

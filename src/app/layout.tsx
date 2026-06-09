import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import Header from '@/components/header'
import Footer from '@/components/footer'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://flowstas.com'),
  title: {
    default: 'Flowstas | Publish your website in seconds',
    template: '%s | Flowstas',
  },
  description: 'Add your small website, hit publish, and share a live link — no servers, no setup. Your contact form collects messages for you.',
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
    description: 'Add your small website, hit publish, and share a live link. Your contact form collects messages for you.',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

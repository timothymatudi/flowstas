import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import Header from '@/components/header'
import Footer from '@/components/footer'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://flowstas.com'),
  title: {
    default: 'Flowstas | Streamline Your Business Operations',
    template: '%s | Flowstas',
  },
  description: 'The all-in-one platform that helps you manage, grow, and scale your business. Trusted by 10,000+ businesses worldwide. Start your free trial today.',
  keywords: [
    'business operations',
    'workflow automation',
    'task management',
    'team collaboration',
    'SaaS platform',
    'business analytics',
  ],
  applicationName: 'Flowstas',
  authors: [{ name: 'Flowstas' }],
  generator: 'v0.app',
  openGraph: {
    type: 'website',
    url: 'https://flowstas.com',
    siteName: 'Flowstas',
    title: 'Flowstas | Streamline Your Business Operations',
    description: 'Automate repetitive tasks, manage workflows, and scale your business with the most powerful operations platform built for modern teams.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flowstas | Streamline Your Business Operations',
    description: 'Automate repetitive tasks, manage workflows, and scale your business — all in one platform.',
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

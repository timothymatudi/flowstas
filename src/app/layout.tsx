import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { IntroOverlay } from '@/components/intro-overlay'
import './globals.css'

// Runs synchronously before the app paints: on the homepage, if the visitor
// hasn't seen the intro (or forced it with ?intro=1), mark <html> so the static
// cover paints immediately — no flash of the app before the intro launches.
const introBootstrap = `(function(){try{
  if(location.pathname!=='/')return;
  var force=/[?&]intro=/.test(location.search);
  var seen=false;try{seen=localStorage.getItem('flowstas-intro-seen')==='1'}catch(e){}
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(force||(!seen&&!reduce))document.documentElement.classList.add('intro-active');
}catch(e){}})();`

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning: the bootstrap script mutates <html>'s class
    // before hydration, which is an intentional, expected SSR/client mismatch.
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        {/* Runs before the rest of the body paints (see introBootstrap), then an
            instant dark cover so the app never flashes in front of the intro. */}
        <script dangerouslySetInnerHTML={{ __html: introBootstrap }} />
        <div id="intro-precover" aria-hidden="true" />
        <IntroOverlay />
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

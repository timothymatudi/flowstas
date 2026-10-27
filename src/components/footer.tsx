import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function Footer() {
  const t = useTranslations('footer')

  const footerLinks = {
    product: [
      { href: '/publish', label: t('publishSite') },
      { href: '/#features', label: t('features') },
      { href: '/pricing', label: t('pricing') },
    ],
    company: [
      { href: '/about', label: t('aboutUs') },
      { href: '/contact', label: t('contact') },
      { href: '/privacy', label: t('privacyPolicy') },
      { href: '/terms', label: t('termsOfService') },
    ],
    resources: [
      { href: '/contact', label: t('support') },
      { href: '/#faq', label: t('faq') },
    ],
  }

  return (
    <footer className="border-t border-border glass">
      <div className="container mx-auto px-4 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary glow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-2xl gradient-text">Flowstas</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t('tagline')}
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="mb-5 text-sm font-semibold text-foreground">{t('productCol')}</h4>
            <ul className="space-y-3.5">
              {footerLinks.product.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-5 text-sm font-semibold text-foreground">{t('companyCol')}</h4>
            <ul className="space-y-3.5">
              {footerLinks.company.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="mb-5 text-sm font-semibold text-foreground">{t('supportCol')}</h4>
            <ul className="space-y-3.5">
              {footerLinks.resources.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Flowstas. {t('copyright')}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {t('privacy')}
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {t('terms')}
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {t('contact')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

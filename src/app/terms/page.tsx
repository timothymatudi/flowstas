import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: April 1, 2026</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Flowstas, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Permission is granted to temporarily access and use Flowstas for personal or commercial business purposes, subject to the following restrictions:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>You must not modify or copy our software without permission</li>
              <li>You must not use the service for any unlawful purpose</li>
              <li>You must not attempt to reverse engineer any software contained on Flowstas</li>
              <li>You must not remove any copyright or proprietary notations</li>
              <li>You must not transfer your account to another person without our consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed">
              To access certain features of Flowstas, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for any activities or actions under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Billing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Some aspects of the Service are provided on a paid basis. You will be billed in advance on a recurring basis (monthly or annually, depending on your selection). Your subscription will automatically renew unless you cancel it or we terminate it.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to change our prices at any time. If we change pricing, we will provide notice of the change on the site or by email, at our option, at least 30 days before the change takes effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Refund Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We offer a 30-day money-back guarantee for all paid plans. If you are not satisfied with our service within the first 30 days of your subscription, contact our support team for a full refund. Refunds requested after the 30-day period will be evaluated on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Flowstas and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks may not be used in connection with any product or service without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. User Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of any content you submit, post, or display on or through the Service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content solely for the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall Flowstas, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at{' '}
              <Link href="/contact" className="text-primary underline underline-offset-4">
                our contact page
              </Link>{' '}
              or email us at legal@flowstas.com.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

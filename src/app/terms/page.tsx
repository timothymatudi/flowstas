export default function TermsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 pb-12 pt-24 lg:pb-16 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent via-background to-background" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-muted-foreground">Last updated: March 30, 2026</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-12">
              <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-premium">
                <h2 className="mb-4 text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
                <p className="leading-relaxed text-muted-foreground">
                  By accessing or using Flowstas services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-premium">
                <h2 className="mb-4 text-xl font-semibold text-foreground">2. Subscription Services</h2>
                <p className="leading-relaxed text-muted-foreground">
                  Flowstas offers subscription-based services. By subscribing, you agree to pay the applicable fees and authorize us to charge your payment method on a recurring basis until you cancel.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-premium">
                <h2 className="mb-4 text-xl font-semibold text-foreground">3. Cancellation</h2>
                <p className="leading-relaxed text-muted-foreground">
                  You may cancel your subscription at any time. Upon cancellation, you will continue to have access to the service until the end of your current billing period.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-premium">
                <h2 className="mb-4 text-xl font-semibold text-foreground">4. Refunds</h2>
                <p className="leading-relaxed text-muted-foreground">
                  We offer a 14-day money-back guarantee for new subscribers. If you are not satisfied with our service, contact us within 14 days of your first payment for a full refund.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-premium">
                <h2 className="mb-4 text-xl font-semibold text-foreground">5. Contact</h2>
                <p className="leading-relaxed text-muted-foreground">
                  For any questions regarding these Terms of Service, please contact us at legal@flowstas.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

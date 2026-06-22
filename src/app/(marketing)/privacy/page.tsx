export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 pb-12 pt-24 lg:pb-16 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent via-background to-background" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Privacy Policy
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
                <h2 className="mb-4 text-xl font-semibold text-foreground">1. Information We Collect</h2>
                <p className="leading-relaxed text-muted-foreground">
                  We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include your name, email address, payment information, and any other information you choose to provide.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-premium">
                <h2 className="mb-4 text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
                <p className="leading-relaxed text-muted-foreground">
                  We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-premium">
                <h2 className="mb-4 text-xl font-semibold text-foreground">3. Data Security</h2>
                <p className="leading-relaxed text-muted-foreground">
                  We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access. All payment information is processed securely through Stripe.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-premium">
                <h2 className="mb-4 text-xl font-semibold text-foreground">4. Contact Us</h2>
                <p className="leading-relaxed text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us at privacy@flowstas.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

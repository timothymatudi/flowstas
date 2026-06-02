import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 shadow-premium">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">Payment Successful!</h1>
          <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
            Thank you for your subscription. You will receive a confirmation email shortly with your account details and next steps.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-12 rounded-xl px-8 shadow-premium">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="h-12 rounded-xl px-8">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, ArrowRight, Mail } from 'lucide-react'

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-10 pb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for subscribing to Flowstas. Your account has been upgraded and you now have access to all premium features.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Confirmation Email Sent</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent a receipt to your email address with all the details of your purchase.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/billing">View Billing Details</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Need help?{' '}
            <Link href="/contact" className="text-primary underline underline-offset-4">
              Contact our support team
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

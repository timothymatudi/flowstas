import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-10 pb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground mb-6">
            Your payment was cancelled and you have not been charged. If you encountered any issues during checkout, please let us know.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Having trouble?</p>
                <p className="text-sm text-muted-foreground">
                  If you experienced any issues during checkout, our support team is here to help you complete your purchase.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/pricing">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Pricing
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Changed your mind?{' '}
            <Link href="/" className="text-primary underline underline-offset-4">
              Learn more about Flowstas
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

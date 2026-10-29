'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Lock, CreditCard, Zap } from 'lucide-react'

// Paths the user can still reach after their trial expires so they can pay.
const ALLOWED_PATHS = ['/dashboard/billing', '/pricing']

export function TrialExpiredGate({
  children,
  trialExpired,
}: {
  children: React.ReactNode
  trialExpired: boolean
}) {
  const pathname = usePathname()

  if (!trialExpired || ALLOWED_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
        <Lock className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold mb-3">Your trial has ended</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Your free trial has expired. Choose a plan to keep publishing sites and deploying apps.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/pricing"
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          View Plans
        </Link>
        <Link
          href="/dashboard/billing"
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Manage Billing
        </Link>
      </div>
    </div>
  )
}

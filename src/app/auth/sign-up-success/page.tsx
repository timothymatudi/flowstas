import Link from 'next/link'
import { Mail, ArrowRight } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid bg-radial px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8 glow">
          <Mail className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4">Check your email</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          We&apos;ve sent you a confirmation link. Click the link in your email to activate your account and start your 1-day free trial.
        </p>

        <div className="glass rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-2">What&apos;s next?</h3>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">1.</span>
              Check your inbox for the confirmation email
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">2.</span>
              Click the link to verify your account
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">3.</span>
              Start exploring Flowstas with full access
            </li>
          </ul>
        </div>

        <Link
          href="/auth/login"
          className="btn-secondary inline-flex items-center gap-2"
        >
          Go to Login
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

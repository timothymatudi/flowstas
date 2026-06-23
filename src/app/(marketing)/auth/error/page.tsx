import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background bg-grid px-4">
      <div className="absolute inset-0 hero-mesh pointer-events-none" />
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-8">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>

        <h1 className="font-display text-3xl text-foreground mb-4">Authentication Error</h1>
        <p className="text-muted-foreground mb-8">
          Something went wrong during authentication. This could be due to an expired link or invalid credentials.
        </p>

        <Link
          href="/auth/login"
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </div>
  )
}

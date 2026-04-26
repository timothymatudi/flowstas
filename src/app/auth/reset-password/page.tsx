'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="text-primary-foreground text-2xl font-bold">Flowstas</div>
        <div>
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">Reset your password</h2>
          <p className="text-primary-foreground/70 text-lg">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>
        <p className="text-primary-foreground/50 text-sm">© 2026 Flowstas. All rights reserved.</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <div className="lg:hidden text-2xl font-bold mb-8">Flowstas</div>
            <h1 className="text-2xl font-bold text-foreground">Forgot your password?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Remember it?{' '}
              <Link href="/auth/login" className="font-medium text-primary underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>

          {sent ? (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-800">
              <p className="font-medium">Check your email</p>
              <p className="mt-1">We sent a password reset link to <strong>{email}</strong>.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

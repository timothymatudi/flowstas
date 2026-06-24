'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from 'next-intl'

export default function ResetPasswordPage() {
  const t = useTranslations('authReset')
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background bg-grid px-4">
      <div className="absolute inset-0 hero-mesh pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <span className="text-xl font-bold text-white">F</span>
          </div>
          <span className="text-2xl font-bold gradient-text">Flowstas</span>
        </Link>

        <div className="glass rounded-2xl p-8 shadow-premium-lg glow">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl text-foreground mb-2">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('rememberIt')}{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                {t('signIn')}
              </Link>
            </p>
          </div>

          {sent ? (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-4 text-sm text-green-600">
              <p className="font-medium">{t('checkEmail')}</p>
              <p className="mt-1">
                {t('sentLinkPrefix')} <strong>{email}</strong>{t('sentLinkSuffix')}
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {loading ? t('sending') : t('sendResetLink')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

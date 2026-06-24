'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { submitContact } from '@/app/actions/contact'

export default function ContactPage() {
  const t = useTranslations('contact')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setLoading(true)
    const result = await submitContact({
      firstName: String(fd.get('firstName') || ''),
      lastName: String(fd.get('lastName') || ''),
      email: String(fd.get('email') || ''),
      subject: String(fd.get('subject') || ''),
      message: String(fd.get('message') || ''),
    })
    setLoading(false)
    if (result.error) {
      toast.error(t('toastError'))
      return
    }
    toast.success(t('toastSuccess'))
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 pb-16 pt-24 lg:pb-24 lg:pt-32">
        <div className="absolute inset-0 hero-mesh pointer-events-none -z-10" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block mb-5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold uppercase tracking-wider text-primary">
              {t('eyebrow')}
            </span>
            <h1 className="font-display text-balance text-5xl leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
              <span className="text-foreground">{t('titleA')}</span>
              <span className="gradient-text">{t('titleB')}</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              {t('subtitle')}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Contact Content */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-5">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-premium-lg lg:p-10">
                {submitted ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <Send className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="mb-2 font-display text-2xl font-bold text-foreground">{t('sentTitle')}</h3>
                    <p className="text-muted-foreground">
                      {t('sentBody')}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium">{t('firstName')}</Label>
                        <Input id="firstName" name="firstName" placeholder="John" required className="h-12 rounded-xl border-border/60 bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium">{t('lastName')}</Label>
                        <Input id="lastName" name="lastName" placeholder="Doe" required className="h-12 rounded-xl border-border/60 bg-background" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">{t('email')}</Label>
                      <Input id="email" name="email" type="email" placeholder="john@example.com" required className="h-12 rounded-xl border-border/60 bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">{t('subject')}</Label>
                      <Input id="subject" name="subject" placeholder={t('phSubject')} required className="h-12 rounded-xl border-border/60 bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">{t('message')}</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder={t('phMessage')}
                        rows={5}
                        required
                        className="rounded-xl border-border/60 bg-background resize-none"
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base shadow-premium hover:shadow-premium-lg">
                      {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('sending')}</>
                      ) : (
                        t('send')
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-8 lg:col-span-2">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{t('infoTitle')}</h2>
                <p className="mt-2 text-muted-foreground">
                  {t('infoSubtitle')}
                </p>
              </div>

              <div className="space-y-6">
                <div className="card-hover flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-premium">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t('emailLabel')}</h3>
                    <p className="mt-1 text-muted-foreground">support@flowstas.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CheckCircle2 } from 'lucide-react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-20 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground text-lg">Have a question or need help? We&apos;d love to hear from you.</p>
        </div>

        {sent ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2">Message sent!</h2>
            <p className="text-muted-foreground">We&apos;ll get back to you within 24 hours.</p>
            <Button className="mt-6" asChild><Link href="/">Back to home</Link></Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5 rounded-xl border bg-card p-8">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" placeholder="John" required className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" placeholder="Doe" required className="h-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" required className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="How can we help?" required className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                required
                rows={5}
                placeholder="Tell us more..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] resize-none"
              />
            </div>
            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? 'Sending...' : 'Send message'}
            </Button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  )
}

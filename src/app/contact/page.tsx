'use client'

import { useState } from 'react'
import { Mail, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { submitContact } from '@/app/actions/contact'

export default function ContactPage() {
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
      toast.error('Could not send your message. Please try again.')
      return
    }
    toast.success("Message sent! We'll get back to you as soon as we can.")
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 pb-16 pt-24 lg:pb-24 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent via-background to-background" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Get in Touch
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Have a question or need help? We&apos;d love to hear from you. Our team is ready to assist.
            </p>
          </div>
        </div>
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
                    <h3 className="mb-2 text-2xl font-bold text-foreground">Message Sent!</h3>
                    <p className="text-muted-foreground">
                      We&apos;ve received your message and will get back to you as soon as we can.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                        <Input id="firstName" name="firstName" placeholder="John" required className="h-12 rounded-xl border-border/60 bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                        <Input id="lastName" name="lastName" placeholder="Doe" required className="h-12 rounded-xl border-border/60 bg-background" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="john@example.com" required className="h-12 rounded-xl border-border/60 bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                      <Input id="subject" name="subject" placeholder="How can we help?" required className="h-12 rounded-xl border-border/60 bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us more about your question..."
                        rows={5}
                        required
                        className="rounded-xl border-border/60 bg-background resize-none"
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base shadow-premium hover:shadow-premium-lg">
                      {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                      ) : (
                        'Send Message'
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-8 lg:col-span-2">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Contact Information</h2>
                <p className="mt-2 text-muted-foreground">
                  Reach out through any of these channels and we&apos;ll respond as soon as possible.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-premium transition-all hover:shadow-premium-lg">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground/5">
                    <Mail className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Email</h3>
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

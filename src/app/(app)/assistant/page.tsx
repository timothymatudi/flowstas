import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GlobalAssistant } from '@/components/global-assistant'

export const dynamic = 'force-dynamic'

export default async function AssistantPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <main className="relative min-h-screen overflow-hidden bg-background bg-grid">
      {/* Futuristic ambient field */}
      <div className="pointer-events-none absolute inset-0 hero-mesh" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 lg:py-16">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-premium-lg animate-pulse-glow">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-white">
              <path d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3.2" fill="currentColor" />
            </svg>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Online · Agent mode
          </span>
          <h1 className="mt-4 font-display text-4xl tracking-tight md:text-5xl">
            <span className="text-foreground">Your </span>
            <span className="gradient-text">AI co-pilot.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Describe what you want to host or deploy — I build it, connect the domain and handle billing. I always ask before anything goes live.
          </p>
        </div>

        {/* Console */}
        <div className="mt-10 rounded-3xl glass-light glow p-5 sm:p-7">
          <GlobalAssistant />
        </div>
      </div>
    </main>
  )
}

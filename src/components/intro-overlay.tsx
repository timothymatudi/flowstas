'use client'

import { useEffect, useRef, useState } from 'react'

// First-visit intro: a "Going Live" deploy sequence — files upload, the site
// builds, HTTPS is provisioned, it ships, and a Live badge lights up — then the
// intro cross-fades away to reveal the app behind it. The app never flashes
// first: an inline bootstrap script (in layout) paints a dark cover before
// hydration and marks <html class="intro-active">; this component reads that
// class to decide whether to play, then clears it on the way out.
//
// A time-and-language-aware greeting shows instantly; a fresh AI-generated line
// from /api/intro swaps in if it lands in time. Skippable; shown once per
// visitor (localStorage), disabled for reduced-motion, forceable with ?intro=1.

const SEEN_KEY = 'flowstas-intro-seen'
const FADE = 600 // keep in sync with .intro-closing transition in globals.css

const GREETINGS: Record<string, { morning: string; afternoon: string; evening: string }> = {
  en: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
  fr: { morning: 'Bonjour', afternoon: 'Bon après-midi', evening: 'Bonsoir' },
  sw: { morning: 'Habari ya asubuhi', afternoon: 'Habari ya mchana', evening: 'Habari ya jioni' },
  ln: { morning: 'Mbote', afternoon: 'Mbote', evening: 'Mbote na butu' },
}
const TAGLINE: Record<string, string> = {
  en: 'The future is AI — and it’s here.',
  fr: 'Le futur, c’est l’IA — et il est là.',
  sw: 'Wakati ujao ni AI — na umefika.',
  ln: 'Lobi ezali AI — mpe esili.',
}
const SITES = [
  'sunrise-bakery.flowstas.com',
  'atelier-noir.flowstas.com',
  'kivu-coffee.flowstas.com',
  'lumen-studio.flowstas.com',
]
const COMMAND = 'flowstas deploy'
const STEPS = ['Uploading files', 'Building site', 'Provisioning HTTPS', 'Deploying to edge']

// step 0 = typing the command; 1..STEPS.length = that step is running;
// step > STEPS.length = live. Tuned so the whole intro runs ~3s before it
// fades out to reveal the app.
const TIMINGS = [380, 760, 1140, 1520, 1950] // steps 1..4, then live
const HOLD = 1050 // bask in "Live" before revealing the app (live + HOLD ≈ 3s)

function currentPeriod(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}
function currentLang(): string {
  const l = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2).toLowerCase()
  return GREETINGS[l] ? l : 'en'
}

export function IntroOverlay() {
  const [show, setShow] = useState(false)
  const [enter, setEnter] = useState(false)
  const [closing, setClosing] = useState(false)
  const [step, setStep] = useState(0)
  const [cmdLen, setCmdLen] = useState(0)
  const [greeting, setGreeting] = useState('')
  const [tag, setTag] = useState('')
  const [domain, setDomain] = useState(SITES[0])
  const timers = useRef<number[]>([])

  const live = step > STEPS.length

  function dismiss() {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {}
    setClosing(true)
    document.documentElement.classList.add('intro-closing') // fades the cover
    timers.current.push(
      window.setTimeout(() => {
        setShow(false)
        document.documentElement.classList.remove('intro-active', 'intro-closing')
      }, FADE)
    )
  }

  useEffect(() => {
    // The bootstrap script already decided whether to play (homepage, not seen
    // or forced, motion allowed) and set this class before paint.
    if (!document.documentElement.classList.contains('intro-active')) return

    const lang = currentLang()
    const period = currentPeriod()
    setGreeting(GREETINGS[lang][period])
    setTag(TAGLINE[lang])
    setDomain(SITES[Math.floor(Math.random() * SITES.length)])
    setShow(true)
    requestAnimationFrame(() => setEnter(true))

    // Type the command quickly, before the first deploy step kicks in.
    let i = 0
    const typer = window.setInterval(() => {
      i += 1
      setCmdLen(i)
      if (i >= COMMAND.length) window.clearInterval(typer)
    }, Math.round(320 / COMMAND.length))

    TIMINGS.forEach((at, idx) => {
      timers.current.push(window.setTimeout(() => setStep(idx + 1), at))
    })

    // Fresh AI greeting; swap in only if it lands early enough to feel intentional.
    const started = Date.now()
    fetch(`/api/intro?lang=${lang}&period=${period}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.greeting && Date.now() - started < 1800) setGreeting(d.greeting)
      })
      .catch(() => {})

    timers.current.push(window.setTimeout(dismiss, TIMINGS[TIMINGS.length - 1] + HOLD))
    const t = timers.current
    return () => {
      t.forEach(clearTimeout)
      window.clearInterval(typer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!show) return null

  const rise = (delay: string) =>
    `transition-all duration-700 ${delay} ${enter ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-gray-950 text-white transition-opacity duration-[600ms] ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-colors duration-700"
        style={{
          background: live
            ? 'radial-gradient(65% 55% at 50% 42%, rgba(16,185,129,0.18), rgba(2,6,23,0) 70%)'
            : 'radial-gradient(60% 50% at 50% 40%, rgba(99,102,241,0.22), rgba(2,6,23,0) 70%)',
        }}
      />

      {/* Greeting */}
      <div className="relative z-10 px-6 text-center">
        <p className={`text-sm font-medium uppercase tracking-[0.2em] text-white/40 ${rise('delay-0')}`}>
          {greeting}
        </p>
        <h2 className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${rise('delay-100')}`}>
          welcome to the future
        </h2>
      </div>

      {/* Deploy card */}
      <div
        className={`relative z-10 mt-8 w-[min(92vw,460px)] rounded-xl border border-white/10 bg-gray-900/80 p-5 font-mono text-sm shadow-2xl backdrop-blur transition-all duration-700 ${
          enter ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        } ${live ? 'border-emerald-500/40 shadow-emerald-500/10' : ''}`}
      >
        {/* command line */}
        <div className="flex items-center gap-2 text-white/80">
          <span className="text-emerald-400">$</span>
          <span>
            {COMMAND.slice(0, cmdLen)}
            {!live && cmdLen < COMMAND.length && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-white/60 align-middle" />}
          </span>
        </div>

        {/* deploy steps */}
        <ul className="mt-4 space-y-2.5">
          {STEPS.map((label, i) => {
            const n = i + 1
            const state = step > n ? 'done' : step === n ? 'active' : 'pending'
            return (
              <li
                key={label}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  state === 'pending' ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <span className="grid h-4 w-4 place-items-center">
                  {state === 'done' ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : state === 'active' ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  )}
                </span>
                <span className={state === 'done' ? 'text-white/70' : 'text-white'}>{label}</span>
              </li>
            )
          })}
        </ul>

        {/* live result */}
        <div
          className={`mt-4 flex items-center gap-3 border-t border-white/10 pt-4 transition-all duration-500 ${
            live ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'
          }`}
        >
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
          </span>
          <span className="truncate text-white/80">{domain}</span>
        </div>
      </div>

      {/* tagline */}
      <p
        className={`relative z-10 mt-5 text-center text-base text-white/50 transition-all duration-500 ${
          live ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        {tag}
      </p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          dismiss()
        }}
        className="absolute bottom-8 z-10 text-sm text-white/40 transition-colors hover:text-white/80"
      >
        Skip intro →
      </button>
    </div>
  )
}

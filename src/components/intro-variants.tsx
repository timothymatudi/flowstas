'use client'

import { useEffect, useState } from 'react'

// The first-visit intro scene. A self-contained ~3s scene that animates on
// mount and renders only its own visuals. The orchestrator (intro-overlay)
// supplies a localized tagline, paints the shared dark stage + Skip button,
// and fades it all away. The scene runs its own timer but never dismisses
// itself.

export type IntroSceneProps = {
  greeting: string
  tag: string
  domain: string
}

// advances 0 → steps.length as each timeout (ms from mount) elapses.
function useTimeline(steps: number[]) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const timers = steps.map((at, i) => window.setTimeout(() => setPhase(i + 1), at))
    return () => timers.forEach(clearTimeout)
  }, [])
  return phase
}

/* -------------------------------------------------------------------- Manifesto
   Kinetic typography: words snap in one by one, landing on the wordmark. */

const M_LINES = ['Your idea.', 'Online.', 'In minutes.']
const M_TIMINGS = [150, 850, 1550, 2300]

export function Manifesto({ tag }: IntroSceneProps) {
  const phase = useTimeline(M_TIMINGS)
  const final = phase >= 4

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 50% at 50% 45%, rgba(99,102,241,0.16), rgba(2,6,23,0) 70%)' }}
      />
      <div className="relative z-10 px-6 text-center">
        {!final ? (
          <h2 key={phase} className="intro-pop text-4xl font-bold tracking-tight sm:text-6xl">
            {phase >= 1 ? M_LINES[phase - 1] : ''}
          </h2>
        ) : (
          <div>
            <h2 className="intro-pop bg-gradient-to-r from-indigo-300 via-white to-emerald-300 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-7xl">
              FLOWSTAS
            </h2>
            <p className="intro-pop mt-5 text-base text-white/55" style={{ animationDelay: '0.2s' }}>
              {tag}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

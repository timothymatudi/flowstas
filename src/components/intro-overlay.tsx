'use client'

import { useEffect, useRef, useState } from 'react'
import { Manifesto } from './intro-variants'

// First-visit intro. The "Manifesto" scene lives in ./intro-variants; this
// orchestrator decides whether to play (homepage, not seen or forced via
// ?intro=, motion allowed — all set on <html class="intro-active"> by the
// inline bootstrap in layout BEFORE paint), supplies a localized tagline,
// paints the shared dark stage + Skip button, then cross-fades it all away to
// reveal the app.
//
// ?intro=1 (or ?intro=manifesto) force-replays the intro for QA.

const SEEN_KEY = 'flowstas-intro-seen'
const FADE = 600 // keep in sync with .intro-closing transition in globals.css
const DURATION = 3000 // time the scene is on screen before the cross-fade out (ms)

const TAGLINE: Record<string, string> = {
  en: 'Your idea. Online. In minutes.',
  fr: 'Votre idée. En ligne. En quelques minutes.',
  sw: 'Wazo lako. Mtandaoni. Kwa dakika chache.',
  ln: 'Likanisi na yo. Na Internet. Na miniti moke.',
}

function currentLang(): string {
  const l = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2).toLowerCase()
  return TAGLINE[l] ? l : 'en'
}

export function IntroOverlay() {
  const [show, setShow] = useState(false)
  const [closing, setClosing] = useState(false)
  const [tag, setTag] = useState('')
  const timers = useRef<number[]>([])

  function dismiss() {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      // localStorage can be unavailable (private mode); the intro just replays.
    }
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
    // The bootstrap script already decided whether to play and set this class.
    if (!document.documentElement.classList.contains('intro-active')) return

    setTag(TAGLINE[currentLang()])
    setShow(true)

    timers.current.push(window.setTimeout(dismiss, DURATION))
    const t = timers.current
    return () => t.forEach(clearTimeout)
  }, [])

  if (!show) return null

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-gray-950 text-white transition-opacity duration-[600ms] ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <Manifesto greeting="" tag={tag} domain="" />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          dismiss()
        }}
        className="absolute bottom-8 z-20 text-sm text-white/40 transition-colors hover:text-white/80"
      >
        Skip intro →
      </button>
    </div>
  )
}

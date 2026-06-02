'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, ArrowRight, Sparkles } from 'lucide-react'

export interface OnboardingStep {
  label: string
  description: string
  done: boolean
  href: string
  cta: string
}

export default function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const [dismissed, setDismissed] = useState(false)
  const completed = steps.filter((s) => s.done).length
  const allDone = completed === steps.length
  const pct = Math.round((completed / steps.length) * 100)

  if (dismissed || allDone) return null

  return (
    <div className="glass-light rounded-2xl p-6 mb-8 border border-primary/20">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Get started with Flowstas</h3>
            <p className="text-sm text-muted-foreground">
              {completed} of {steps.length} steps complete — finish setup to get the most out of your account.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss checklist"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-5">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.label}
            className="flex items-center gap-3 rounded-xl bg-background/40 px-4 py-3"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                step.done ? 'bg-green-500/20 text-green-500' : 'border-2 border-muted-foreground/30'
              }`}
            >
              {step.done && <Check className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                {step.cta}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

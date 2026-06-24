'use client'

import { useCurrency } from '@/components/currency-provider'
import { CURRENCIES, isCurrency } from '@/lib/currency'

// Lets the visitor pick the currency prices are shown (and charged) in.
export function CurrencySwitcher({ className = '' }: { className?: string }) {
  const { currency, setCurrency } = useCurrency()
  return (
    <select
      aria-label="Currency"
      value={currency}
      onChange={(e) => {
        if (isCurrency(e.target.value)) setCurrency(e.target.value)
      }}
      className={`cursor-pointer rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-primary ${className}`}
    >
      {Object.values(CURRENCIES).map((c) => (
        <option key={c.code} value={c.code}>
          {c.label}
        </option>
      ))}
    </select>
  )
}

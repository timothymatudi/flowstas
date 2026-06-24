'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { DEFAULT_CURRENCY, type CurrencyCode } from '@/lib/currency'

export const CURRENCY_COOKIE = 'FLOWSTAS_CURRENCY'

type Ctx = { currency: CurrencyCode; setCurrency: (c: CurrencyCode) => void }
const CurrencyContext = createContext<Ctx>({ currency: DEFAULT_CURRENCY, setCurrency: () => {} })

// Holds the visitor's display currency. Seeded server-side (cookie or geo) and
// persisted to a cookie when changed. Conversion is instant + client-side, so
// switching currency needs no page reload.
export function CurrencyProvider({
  initialCurrency,
  children,
}: {
  initialCurrency: CurrencyCode
  children: React.ReactNode
}) {
  const [currency, setState] = useState<CurrencyCode>(initialCurrency)
  const setCurrency = useCallback((c: CurrencyCode) => {
    setState(c)
    document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  }, [])
  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  return useContext(CurrencyContext)
}

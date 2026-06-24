// Multi-currency pricing. Base prices live in GBP pence (see lib/products.ts);
// here we convert + format them for the visitor's currency, and produce the
// Stripe `unit_amount` (smallest unit) for charging in that currency.
//
// `rate` = units of this currency per 1 GBP. These are APPROXIMATE — refresh
// periodically or wire to a live FX API. `decimals` = the currency's minor-unit
// digits (JPY has none).
export interface CurrencyInfo {
  code: string
  label: string
  locale: string
  decimals: number
  rate: number
}

export const CURRENCIES = {
  GBP: { code: 'GBP', label: 'GBP £', locale: 'en-GB', decimals: 2, rate: 1 },
  USD: { code: 'USD', label: 'USD $', locale: 'en-US', decimals: 2, rate: 1.27 },
  EUR: { code: 'EUR', label: 'EUR €', locale: 'de-DE', decimals: 2, rate: 1.17 },
  INR: { code: 'INR', label: 'INR ₹', locale: 'en-IN', decimals: 2, rate: 106 },
  BRL: { code: 'BRL', label: 'BRL R$', locale: 'pt-BR', decimals: 2, rate: 6.4 },
  CAD: { code: 'CAD', label: 'CAD $', locale: 'en-CA', decimals: 2, rate: 1.73 },
  AUD: { code: 'AUD', label: 'AUD $', locale: 'en-AU', decimals: 2, rate: 1.93 },
  JPY: { code: 'JPY', label: 'JPY ¥', locale: 'ja-JP', decimals: 0, rate: 192 },
  CNY: { code: 'CNY', label: 'CNY ¥', locale: 'zh-CN', decimals: 2, rate: 9.1 },
  AED: { code: 'AED', label: 'AED د.إ', locale: 'ar-AE', decimals: 2, rate: 4.66 },
  NGN: { code: 'NGN', label: 'NGN ₦', locale: 'en-NG', decimals: 2, rate: 1950 },
  ZAR: { code: 'ZAR', label: 'ZAR R', locale: 'en-ZA', decimals: 2, rate: 23.5 },
} satisfies Record<string, CurrencyInfo>

export type CurrencyCode = keyof typeof CURRENCIES
export const DEFAULT_CURRENCY: CurrencyCode = 'USD'

export function isCurrency(value: string): value is CurrencyCode {
  return value in CURRENCIES
}

// Map an ISO country code (e.g. from a geo header) to a supported currency.
const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  GB: 'GBP', US: 'USD', CA: 'CAD', AU: 'AUD', JP: 'JPY', CN: 'CNY', IN: 'INR',
  BR: 'BRL', NG: 'NGN', ZA: 'ZAR', AE: 'AED',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', IE: 'EUR', PT: 'EUR',
  AT: 'EUR', BE: 'EUR', FI: 'EUR', GR: 'EUR',
}
export function currencyForCountry(country?: string | null): CurrencyCode {
  if (country && COUNTRY_CURRENCY[country]) return COUNTRY_CURRENCY[country]
  return DEFAULT_CURRENCY
}

// Major-unit value (for display), e.g. 12.7 for USD from 1000 GBP pence.
export function toMajor(gbpPence: number, code: CurrencyCode): number {
  return (gbpPence / 100) * CURRENCIES[code].rate
}

// Smallest-unit amount for Stripe (e.g. 1270 for USD, 1920 for JPY).
export function toMinorUnits(gbpPence: number, code: CurrencyCode): number {
  const c = CURRENCIES[code]
  return Math.round(toMajor(gbpPence, code) * 10 ** c.decimals)
}

// Localized currency string, e.g. "$12.70", "¥1,920", "₹1,060".
export function formatMoney(gbpPence: number, code: CurrencyCode, locale?: string): string {
  const c = CURRENCIES[code]
  return new Intl.NumberFormat(locale || c.locale, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: c.decimals,
  }).format(toMajor(gbpPence, code))
}

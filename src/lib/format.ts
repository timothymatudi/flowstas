// Locale-aware formatting helpers (Phase A of internationalization). These use
// the platform Intl API so dates, numbers and currency render the way each
// region expects (e.g. "Jun 24, 2026" vs "24 Jun 2026", "1,000" vs "1.000").
// Pass the active locale from next-intl's getLocale()/useLocale().

export function formatDate(date: string | number | Date, locale = 'en', opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, opts ?? { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(date)
  )
}

export function formatNumber(value: number, locale = 'en', opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, opts).format(value)
}

export function formatCurrency(amount: number, currency = 'USD', locale = 'en') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

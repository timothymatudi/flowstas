// The languages Flowstas ships. Adding a new one = add an entry here + a
// matching messages/<code>.json file. Everything else is automatic.
export const locales = [
  'en', 'es', 'zh', 'hi', 'ar', 'pt', 'fr', 'de', 'ja', 'ru', 'id', 'bn',
] as const

export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

// Display name (shown in the language switcher, in the language's own script)
// and text direction (Arabic is right-to-left).
export const localeMeta: Record<Locale, { label: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'English', dir: 'ltr' },
  es: { label: 'Español', dir: 'ltr' },
  zh: { label: '中文', dir: 'ltr' },
  hi: { label: 'हिन्दी', dir: 'ltr' },
  ar: { label: 'العربية', dir: 'rtl' },
  pt: { label: 'Português', dir: 'ltr' },
  fr: { label: 'Français', dir: 'ltr' },
  de: { label: 'Deutsch', dir: 'ltr' },
  ja: { label: '日本語', dir: 'ltr' },
  ru: { label: 'Русский', dir: 'ltr' },
  id: { label: 'Bahasa Indonesia', dir: 'ltr' },
  bn: { label: 'বাংলা', dir: 'ltr' },
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

// Open Graph locale codes (language_TERRITORY) for og:locale meta.
export const ogLocale: Record<Locale, string> = {
  en: 'en_US', es: 'es_ES', zh: 'zh_CN', hi: 'hi_IN', ar: 'ar_AR', pt: 'pt_BR',
  fr: 'fr_FR', de: 'de_DE', ja: 'ja_JP', ru: 'ru_RU', id: 'id_ID', bn: 'bn_BD',
}

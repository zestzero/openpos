/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en, type TranslationKey } from './en'
import { th } from './th'

export type Locale = 'th' | 'en'
export type TranslationVariables = Record<string, string | number>


export type { TranslationKey } from './en'


const resources: Record<Locale, Record<TranslationKey, string>> = { en, th }

export const localeStorageKey = 'openpos.locale.v1'
export const defaultLocale: Locale = 'th'

function isLocale(value: string | null): value is Locale {
  return value === 'th' || value === 'en'
}

export function readStoredLocale(storage?: Storage): Locale {
  try {
    const value = storage?.getItem(localeStorageKey) ?? null
    return isLocale(value) ? value : defaultLocale
  } catch {
    return defaultLocale
  }
}

function interpolate(template: string, variables?: TranslationVariables) {
  if (!variables) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(variables[key] ?? match))
}

export function translate(locale: Locale, key: TranslationKey, variables?: TranslationVariables) {
  return interpolate(resources[locale][key] ?? resources.en[key] ?? key, variables)
}

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US').format(value)
}

export function formatDate(value: Date | number | string, locale: Locale, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', options).format(new Date(value))
}

type I18nValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, variables?: TranslationVariables) => string
  formatNumber: (value: number) => string
  formatDate: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string
}

function createI18nValue(locale: Locale, setLocale: (locale: Locale) => void): I18nValue {
  return {
    locale,
    setLocale,
    t: (key, variables) => translate(locale, key, variables),
    formatNumber: (value) => formatNumber(value, locale),
    formatDate: (value, options) => formatDate(value, locale, options),
  }
}

const I18nContext = createContext<I18nValue>(createI18nValue('en', () => {}))

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale(typeof window === 'undefined' ? undefined : window.localStorage))

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    try {
      window.localStorage.setItem(localeStorageKey, nextLocale)
    } catch {
      // Storage can be unavailable in private browsing or embedded contexts.
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(() => createI18nValue(locale, setLocale), [locale, setLocale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

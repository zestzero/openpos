import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { I18nProvider, defaultLocale, formatNumber, localeStorageKey, readStoredLocale, translate } from '@/lib/i18n'

function LocaleProbe() {
  return <LanguageSwitcher />
}

describe('i18n', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('defaults to Thai and persists a selected locale', () => {
    render(<I18nProvider><LocaleProbe /></I18nProvider>)

    expect(screen.getByRole('group', { name: 'เลือกภาษา' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ไทย' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByRole('group', { name: 'Choose language' })).toBeInTheDocument()
    expect(localStorage.getItem(localeStorageKey)).toBe('en')
  })

  it('falls back to Thai for an invalid stored locale', () => {
    localStorage.setItem(localeStorageKey, 'fr')
    expect(readStoredLocale(localStorage)).toBe(defaultLocale)
  })

  it('interpolates values and formats non-money numbers by locale', () => {
    expect(translate('th', 'pos.viewOrder')).toBe('ดูรายการ')
    expect(formatNumber(1234567, 'en')).toBe('1,234,567')
    expect(formatNumber(1234567, 'th')).toContain('1,234,567')
  })
})

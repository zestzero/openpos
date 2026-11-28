import { ChevronDown } from 'lucide-react'

import { useI18n, type Locale } from '@/lib/i18n'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  const options: Array<{ value: Locale; label: string }> = [
    { value: 'th', label: t('language.thai') },
    { value: 'en', label: t('language.english') },
  ]

  return (
    <div className="relative w-full">
      <select
        id="language-select"
        aria-label={t('language.choose')}
        value={locale}
        onChange={(event) => {
          const value = event.target.value
          if (value === 'th' || value === 'en') setLocale(value)
        }}
        className="h-11 w-full appearance-none rounded-full border border-input bg-card px-4 pr-10 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 opacity-50" aria-hidden="true" />
    </div>
  )
}

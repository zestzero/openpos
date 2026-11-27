import { Button } from '@/components/ui/button'
import { useI18n, type Locale } from '@/lib/i18n'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  const options: Array<{ value: Locale; label: string }> = [
    { value: 'th', label: t('language.thai') },
    { value: 'en', label: t('language.english') },
  ]

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1" role="group" aria-label={t('language.choose')}>
      <span className="sr-only">{t('language.label')}</span>
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={locale === option.value ? 'default' : 'ghost'}
          aria-pressed={locale === option.value}
          onClick={() => setLocale(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

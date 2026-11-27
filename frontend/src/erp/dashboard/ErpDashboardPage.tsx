import { useI18n } from '@/lib/i18n'
export function ErpDashboardPage() {
  const { t } = useI18n()
  return (
    <div className="space-y-6">
      <section className="rounded-card bg-accent p-6 text-accent-foreground md:p-8">
        <div className="max-w-2xl space-y-2">
          <p className="text-sm font-semibold">{t('erp.dashboard')}</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t('erp.overview')}</h1>
          <p className="text-base leading-6">{t('erp.dashboardDescription')}</p>
        </div>
      </section>
    </div>
  )
}
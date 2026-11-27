import { KpiStat } from '@/components/ui/kpi-stat'
import { Card, CardHeader } from '@/components/ui/card'
import { formatTHB } from '@/lib/formatCurrency'
import { formatNumber, useI18n, type Locale, type TranslationKey, type TranslationVariables } from '@/lib/i18n'
import { formatReportingMonth, type ReportingSummary } from '@/lib/reporting-api'

type ReportCardsProps = {
  summary: ReportingSummary | null
  isLoading?: boolean
}
type ReportTranslate = (key: TranslationKey, variables?: TranslationVariables) => string

export function ReportCards({ summary, isLoading = false }: ReportCardsProps) {
  const { t, locale } = useI18n()
  const current = summary?.current
  const previous = summary?.previous
  const showSkeleton = isLoading || !current

  const cards = current
    ? [
        {
          label: t('report.revenue'),
          value: formatTHB(current.revenue),
          highlight: true,
          delta: deltaMeta(current.revenue, previous?.revenue, t),
          note: buildDelta(current.revenue, previous?.revenue, previous?.month ?? null, locale, t),
        },
        {
          label: t('report.grossProfit'),
          value: formatTHB(current.grossProfit),
          highlight: false,
          delta: deltaMeta(current.grossProfit, previous?.grossProfit, t),
          note: buildDelta(current.grossProfit, previous?.grossProfit, previous?.month ?? null, locale, t),
        },
        {
          label: t('report.orderCount'),
          value: t('report.orders', { count: formatNumber(current.orderCount, locale) }),
          highlight: false,
          delta: deltaMeta(current.orderCount, previous?.orderCount, t),
          note: previous ? `${t('report.comparedWith')} ${formatReportingMonth(previous.month, locale)}` : t('report.latestSnapshot'),
        },
        {
          label: t('report.aov'),
          value: formatTHB(current.averageOrderValue),
          highlight: false,
          delta: previous?.averageOrderValue
            ? deltaMeta(current.averageOrderValue, previous.averageOrderValue, t)
            : null,
          note: previous?.averageOrderValue
            ? buildDelta(current.averageOrderValue, previous.averageOrderValue, previous.month, locale, t)
            : t('report.latestSnapshot'),
        },
      ]
    : []

  return (
    <section className="grid gap-4 xl:grid-cols-4">
      {!showSkeleton && cards.length > 0
        ? cards.map((card) => (
            <KpiStat
              key={card.label}
              label={card.label}
              value={card.value}
              delta={card.delta}
              note={card.note}
              highlight={card.highlight}
            />
          ))
        : Array.from({ length: 4 }, (_, index) => (
            <Card key={index} className="border-border/70 bg-card/95">
              <CardHeader className="space-y-3 pb-3">
                <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
                <div className="h-10 w-32 animate-pulse rounded-full bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
              </CardHeader>
            </Card>
          ))}
    </section>
  )
}

function deltaMeta(current: number, previous: number | undefined, translate: ReportTranslate) {
  if (typeof previous !== 'number') return null
  const difference = current - previous
  if (difference === 0) {
    return { direction: 'flat' as const, label: '0%' }
  }
  if (previous === 0) {
    return { direction: difference > 0 ? 'up' as const : 'down' as const, label: difference > 0 ? translate('report.up') : translate('report.down') }
  }
  const percent = Math.abs((difference / previous) * 100).toFixed(1)
  return {
    direction: difference > 0 ? 'up' as const : 'down' as const,
    label: `${difference > 0 ? '+' : '−'}${percent}%`,
  }
}

function buildDelta(
  current: number,
  previous: number | undefined,
  previousMonth: string | null,
  locale: Locale,
  translate: ReportTranslate,
) {
  if (typeof previous !== 'number') return translate('report.latestSnapshot')

  const difference = current - previous
  const monthLabel = previousMonth ? ` ${translate('report.comparedWith')} ${formatReportingMonth(previousMonth, locale)}` : ''

  if (difference === 0) return `${translate('report.flatFromPrevious')}${monthLabel}`

  const prefix = difference > 0 ? '+' : '−'
  const amount = formatTHB(Math.abs(difference))
  const percent = previous === 0 ? null : Math.abs((difference / previous) * 100).toFixed(1)
  const percentLabel = percent ? ` (${prefix === '+' ? '+' : '−'}${percent}%)` : ''

  return `${prefix}${amount}${percentLabel}${monthLabel}`
}

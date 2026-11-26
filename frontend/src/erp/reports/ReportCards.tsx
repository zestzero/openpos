import { KpiStat } from '@/components/ui/kpi-stat'
import { Card, CardHeader } from '@/components/ui/card'
import { formatTHB } from '@/lib/formatCurrency'
import { formatReportingMonth, type ReportingSummary } from '@/lib/reporting-api'

type ReportCardsProps = {
  summary: ReportingSummary | null
  isLoading?: boolean
}

export function ReportCards({ summary, isLoading = false }: ReportCardsProps) {
  const current = summary?.current
  const previous = summary?.previous
  const showSkeleton = isLoading || !current

  const cards = current
    ? [
        {
          label: 'Revenue',
          value: formatTHB(current.revenue),
          highlight: true,
          delta: deltaMeta(current.revenue, previous?.revenue),
          note: buildDelta(current.revenue, previous?.revenue, previous?.month ?? null),
        },
        {
          label: 'Gross profit',
          value: formatTHB(current.grossProfit),
          highlight: false,
          delta: deltaMeta(current.grossProfit, previous?.grossProfit),
          note: buildDelta(current.grossProfit, previous?.grossProfit, previous?.month ?? null),
        },
        {
          label: 'Orders',
          value: `${current.orderCount.toLocaleString('en-US')} orders`,
          highlight: false,
          delta: deltaMeta(current.orderCount, previous?.orderCount),
          note: previous ? `Compared with ${formatReportingMonth(previous.month)}` : 'Latest month snapshot',
        },
        {
          label: 'Average order value',
          value: formatTHB(current.averageOrderValue),
          highlight: false,
          delta: previous?.averageOrderValue
            ? deltaMeta(current.averageOrderValue, previous.averageOrderValue)
            : null,
          note: previous?.averageOrderValue
            ? buildDelta(current.averageOrderValue, previous.averageOrderValue, previous.month)
            : 'Latest month snapshot',
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

function deltaMeta(current: number, previous: number | undefined) {
  if (typeof previous !== 'number') return null
  const difference = current - previous
  if (difference === 0) {
    return { direction: 'flat' as const, label: '0%' }
  }
  if (previous === 0) {
    return { direction: difference > 0 ? 'up' as const : 'down' as const, label: difference > 0 ? 'Up' : 'Down' }
  }
  const percent = Math.abs((difference / previous) * 100).toFixed(1)
  return {
    direction: difference > 0 ? 'up' as const : 'down' as const,
    label: `${difference > 0 ? '+' : '−'}${percent}%`,
  }
}

function buildDelta(current: number, previous: number | undefined, previousMonth: string | null) {
  if (typeof previous !== 'number') return 'Latest month snapshot'

  const difference = current - previous
  const monthLabel = previousMonth ? ` vs ${formatReportingMonth(previousMonth)}` : ''

  if (difference === 0) return `Flat from the previous month${monthLabel}`

  const prefix = difference > 0 ? '+' : '−'
  const amount = formatTHB(Math.abs(difference))
  const percent = previous === 0 ? null : Math.abs((difference / previous) * 100).toFixed(1)
  const percentLabel = percent ? ` (${prefix === '+' ? '+' : '−'}${percent}%)` : ''

  return `${prefix}${amount}${percentLabel}${monthLabel}`
}

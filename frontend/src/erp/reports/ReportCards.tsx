import { ArrowUpRight, Banknote, ShoppingCart, TrendingUp } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTHB } from '@/lib/formatCurrency'
import { formatReportingMonth, type ReportingSummary } from '@/lib/reporting-api'
import { cn } from '@/lib/utils'

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
          icon: Banknote,
          tone: 'brand' as const,
          note: buildDelta(current.revenue, previous?.revenue, previous?.month ?? null),
        },
        {
          label: 'Gross profit',
          value: formatTHB(current.grossProfit),
          icon: TrendingUp,
          tone: current.grossProfit >= 0 ? ('positive' as const) : ('negative' as const),
          note: buildDelta(current.grossProfit, previous?.grossProfit, previous?.month ?? null),
        },
        {
          label: 'Orders',
          value: `${current.orderCount.toLocaleString('en-US')} orders`,
          icon: ShoppingCart,
          tone: 'neutral' as const,
          note: previous ? `Compared with ${formatReportingMonth(previous.month)}` : 'Latest month snapshot',
        },
        {
          label: 'Average order value',
          value: formatTHB(current.averageOrderValue),
          icon: ArrowUpRight,
          tone: 'accent' as const,
          note: previous?.averageOrderValue
            ? buildDelta(current.averageOrderValue, previous.averageOrderValue, previous.month)
            : 'Latest month snapshot',
        },
      ]
    : []

  return (
    <section className="grid gap-4 xl:grid-cols-4">
      {!showSkeleton && cards.length > 0
        ? cards.map((card) => {
            const Icon = card.icon

            return (
              <Card key={card.label} className="border-border/70 bg-card/95">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Icon className={cn('h-4 w-4', toneClass(card.tone))} />
                      {card.label}
                    </div>
                    <span className={cn('text-xs font-medium uppercase tracking-[0.2em]', toneClass(card.tone))}>
                      {card.tone === 'positive' ? 'Healthy' : card.tone === 'negative' ? 'Watch' : 'Live'}
                    </span>
                  </div>
                  <CardTitle className="text-[1.7rem] leading-none tracking-[0.01em]">{card.value}</CardTitle>
                  <CardDescription className="min-h-10 text-sm leading-6 text-muted-foreground">{card.note}</CardDescription>
                </CardHeader>
              </Card>
            )
          })
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

function toneClass(tone: 'brand' | 'positive' | 'negative' | 'neutral' | 'accent') {
  switch (tone) {
    case 'brand':
      return 'text-brand'
    case 'positive':
      return 'text-emerald-600'
    case 'negative':
      return 'text-destructive'
    case 'accent':
      return 'text-brand'
    case 'neutral':
    default:
      return 'text-muted-foreground'
  }
}

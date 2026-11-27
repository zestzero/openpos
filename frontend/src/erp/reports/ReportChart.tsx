import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTHB } from '@/lib/formatCurrency'
import { formatNumber, useI18n } from '@/lib/i18n'
import { formatReportingMonth, type ReportingMonthRow } from '@/lib/reporting-api'

type ReportChartProps = {
  rows: ReportingMonthRow[]
}

export function ReportChart({ rows }: ReportChartProps) {
  const { t, locale } = useI18n()
  const chartRows = [...rows].reverse()

  return (
    <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]" aria-labelledby="monthly-trend-heading">
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="space-y-2 pb-0">
          <CardTitle id="monthly-trend-heading" className="text-xl">{t('report.monthlyTrend')}</CardTitle>
          <CardDescription>{t('report.trendDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart accessibilityLayer data={chartRows} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="oklch(0.88 0.012 120)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tickFormatter={formatReportingMonth}
                />
                <YAxis
                  width={96}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => formatTHB(Number(value))}
                />
                <Tooltip content={<MonthlyTrendTooltip />} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8 }} />
                <Bar dataKey="revenue" name={t('report.revenue')} fill="#c8f169" radius={[8, 8, 0, 0]} />
                <Bar dataKey="grossProfit" name={t('report.grossProfit')} fill="#1c1f16" radius={[8, 8, 0, 0]} />
                <Line type="monotone" dataKey="averageOrderValue" name={t('report.aov')} stroke="#3d4a28" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-secondary/35">
        <CardHeader className="space-y-2 pb-3">
          <CardTitle className="text-lg">{t('report.monthlyBreakdown')}</CardTitle>
          <CardDescription>{t('report.breakdownDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-3">
            {chartRows.map((row) => (
              <li key={row.month} className="rounded-card border border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatReportingMonth(row.month)}</p>
                    <p className="text-xs text-muted-foreground">{t('report.orders', { count: formatNumber(row.orderCount, locale) })}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-foreground">{t('report.revenue')} {formatTHB(row.revenue)}</p>
                    <p className="text-muted-foreground">{t('report.grossProfit')} {formatTHB(row.grossProfit)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}

function MonthlyTrendTooltip({ active, payload, label }: any) {
  const { t } = useI18n()
  if (!active || !payload?.length) return null

  const row = payload[0]?.payload as ReportingMonthRow | undefined

  if (!row) return null

  return (
    <div className="rounded-card border border-border bg-background px-4 py-3 shadow-card">
      <p className="text-sm font-medium text-foreground">{formatReportingMonth(String(label))}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t('report.revenue')} {formatTHB(row.revenue)}</p>
      <p className="text-sm text-muted-foreground">{t('report.grossProfit')} {formatTHB(row.grossProfit)}</p>
      <p className="text-sm text-muted-foreground">{t('report.aov')} {formatTHB(row.averageOrderValue)}</p>
    </div>
  )
}

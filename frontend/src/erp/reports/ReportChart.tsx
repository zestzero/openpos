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
import { formatReportingMonth, type ReportingMonthRow } from '@/lib/reporting-api'

type ReportChartProps = {
  rows: ReportingMonthRow[]
}

export function ReportChart({ rows }: ReportChartProps) {
  const chartRows = [...rows].reverse()

  return (
    <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]" aria-label="Monthly trend">
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="space-y-2 pb-0">
          <CardTitle className="text-xl">Monthly trend</CardTitle>
          <CardDescription>
            Revenue and gross profit move together here, so owners can compare sales volume with margin pressure at a glance.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart accessibilityLayer data={chartRows} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(0, 0, 0, 0.08)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tickFormatter={formatReportingMonth}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => formatTHB(Number(value))}
                />
                <Tooltip content={<MonthlyTrendTooltip />} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#18e299" radius={[8, 8, 0, 0]} />
                <Bar dataKey="grossProfit" name="Gross profit" fill="#0d0d0d" radius={[8, 8, 0, 0]} />
                <Line type="monotone" dataKey="averageOrderValue" name="AOV" stroke="#d45656" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-secondary/35">
        <CardHeader className="space-y-2 pb-3">
          <CardTitle className="text-lg">Monthly breakdown</CardTitle>
          <CardDescription>Each row mirrors the query data that feeds the chart.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-3">
            {chartRows.map((row) => (
              <li key={row.month} className="rounded-card border border-border bg-background px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatReportingMonth(row.month)}</p>
                    <p className="text-xs text-muted-foreground">{row.orderCount.toLocaleString('en-US')} orders</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-foreground">Revenue {formatTHB(row.revenue)}</p>
                    <p className="text-muted-foreground">Gross profit {formatTHB(row.grossProfit)}</p>
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
  if (!active || !payload?.length) return null

  const row = payload[0]?.payload as ReportingMonthRow | undefined

  if (!row) return null

  return (
    <div className="rounded-card border border-border bg-background px-4 py-3 shadow-card">
      <p className="text-sm font-medium text-foreground">{formatReportingMonth(String(label))}</p>
      <p className="mt-2 text-sm text-muted-foreground">Revenue {formatTHB(row.revenue)}</p>
      <p className="text-sm text-muted-foreground">Gross profit {formatTHB(row.grossProfit)}</p>
      <p className="text-sm text-muted-foreground">AOV {formatTHB(row.averageOrderValue)}</p>
    </div>
  )
}

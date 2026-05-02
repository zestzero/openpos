import { useMemo } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatReportingMonth, mergeReportingRows, reportingApi, summarizeReportingRows } from '@/lib/reporting-api'

import { ReportCards } from './ReportCards'
import { ReportChart } from './ReportChart'
import { ReportExportButtons } from './ReportExportButtons'

export function ReportDashboard() {
  const monthlySalesQuery = useQuery({
    queryKey: ['erp', 'monthly-sales'],
    queryFn: () => reportingApi.getMonthlySales(),
  })

  const grossProfitQuery = useQuery({
    queryKey: ['erp', 'gross-profit'],
    queryFn: () => reportingApi.getGrossProfit(),
  })

  const reportRows = useMemo(() => {
    return mergeReportingRows(
      monthlySalesQuery.data?.data ?? [],
      grossProfitQuery.data?.data ?? [],
    )
  }, [grossProfitQuery.data?.data, monthlySalesQuery.data?.data])

  const summary = useMemo(() => summarizeReportingRows(reportRows), [reportRows])

  const isLoading = monthlySalesQuery.isPending || grossProfitQuery.isPending
  const error = monthlySalesQuery.error ?? grossProfitQuery.error ?? null

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-gradient-to-br from-background to-secondary/50 p-6 shadow-card">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-pill border border-brand/25 bg-brand/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-brand">
              Monthly performance
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Monthly sales and gross profit</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Live ERP reporting data pulled from the monthly-sales and gross-profit read models.
                Values stay in THB so owners see the same currency language used everywhere else in OpenPOS.
              </p>
            </div>
          </div>

          {summary?.current ? (
            <div className="flex flex-col gap-3 rounded-card border border-border bg-background px-4 py-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Latest month</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatReportingMonth(summary.current.month)}</p>
                <p className="mt-1 text-muted-foreground">
                  {summary.current.orderCount.toLocaleString('en-US')} orders · {summary.rows.length} months loaded
                </p>
              </div>

              <ReportExportButtons title="Monthly sales and gross profit" rows={summary.rows} />
            </div>
          ) : null}
        </div>
      </section>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertTriangle className="h-5 w-5" />
              We couldn’t load ERP data.
            </CardTitle>
            <CardDescription>
              Check your connection and retry the reporting queries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => Promise.all([monthlySalesQuery.refetch(), grossProfitQuery.refetch()])} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <ReportCards summary={summary} isLoading={isLoading} />

      {summary ? <ReportChart rows={summary.rows} /> : null}
    </div>
  )
}

import { useMemo } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatReportingMonth, mergeReportingRows, reportingApi, summarizeReportingRows } from '@/lib/reporting-api'
import { formatNumber, useI18n } from '@/lib/i18n'

import { ReportCards } from './ReportCards'
import { ReportChart } from './ReportChart'
import { ReportExportButtons } from './ReportExportButtons'

export function ReportDashboard() {
  const { t, locale } = useI18n()
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
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">{t('report.title')}</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t('report.monthlyTitle')}</h1>
            <p className="max-w-2xl text-base leading-6 text-muted-foreground">{t('report.description')}</p>
          </div>

          {summary?.current ? (
            <div className="flex flex-col gap-3 rounded-card border border-border bg-card px-5 py-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t('report.latestMonth')}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatReportingMonth(summary.current.month, locale)}</p>
                <p className="mt-1 text-muted-foreground">
                  {t('report.orders', { count: formatNumber(summary.current.orderCount, locale) })} · {t('report.monthsLoaded', { count: summary.rows.length })}
                </p>
              </div>

              <ReportExportButtons title={t('report.monthlyTitle')} rows={summary.rows} locale={locale} />
            </div>
          ) : null}
      </section>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('report.loadError')}
            </CardTitle>
            <CardDescription>
              {t('report.loadErrorDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => Promise.all([monthlySalesQuery.refetch(), grossProfitQuery.refetch()])} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              {t('report.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && !summary ? (
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle>{t('report.emptyTitle')}</CardTitle>
            <CardDescription>{t('report.emptyDescription')}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <ReportCards summary={summary} isLoading={isLoading} />

      {summary ? <ReportChart rows={summary.rows} /> : null}
    </div>
  )
}

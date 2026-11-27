import { Download, FileSpreadsheet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { type ReportingMonthRow } from '@/lib/reporting-api'
import { type Locale, useI18n } from '@/lib/i18n'

import { exportReportRows } from './exportReport'

type ReportExportButtonsProps = {
  title: string
  rows: ReportingMonthRow[]
  locale: Locale
}

export function ReportExportButtons({ title, rows, locale }: ReportExportButtonsProps) {
  const { t } = useI18n()
  const isDisabled = rows.length === 0

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className="gap-2" disabled={isDisabled} onClick={() => exportReportRows('pdf', { title, rows, locale })}>
        <Download className="h-4 w-4" />
        {t('report.exportPdf')}
      </Button>
      <Button variant="outline" className="gap-2" disabled={isDisabled} onClick={() => exportReportRows('xlsx', { title, rows, locale })}>
        <FileSpreadsheet className="h-4 w-4" />
        {t('report.exportXlsx')}
      </Button>
    </div>
  )
}

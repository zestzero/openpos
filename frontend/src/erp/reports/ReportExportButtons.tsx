import { Download, FileSpreadsheet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { type ReportingMonthRow } from '@/lib/reporting-api'

import { exportReportRows } from './exportReport'

type ReportExportButtonsProps = {
  title: string
  rows: ReportingMonthRow[]
}

export function ReportExportButtons({ title, rows }: ReportExportButtonsProps) {
  const isDisabled = rows.length === 0

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className="gap-2" disabled={isDisabled} onClick={() => exportReportRows('pdf', { title, rows })}>
        <Download className="h-4 w-4" />
        Export PDF
      </Button>
      <Button variant="outline" className="gap-2" disabled={isDisabled} onClick={() => exportReportRows('xlsx', { title, rows })}>
        <FileSpreadsheet className="h-4 w-4" />
        Export XLSX
      </Button>
    </div>
  )
}

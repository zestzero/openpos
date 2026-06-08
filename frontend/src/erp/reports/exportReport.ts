import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'

import { formatTHB } from '@/lib/formatCurrency'
import { formatReportingMonth, type ReportingMonthRow } from '@/lib/reporting-api'

export type ReportExportFormat = 'pdf' | 'xlsx'

export type ReportExportPayload = {
  title: string
  rows: ReportingMonthRow[]
}

export function buildReportExportFilename(format: ReportExportFormat, title: string, rows: Pick<ReportingMonthRow, 'month'>[]) {
  const slug = slugify(title) || 'report'

  if (!rows.length) {
    return `${slug}.${format}`
  }

  const months = [...rows.map((row) => row.month)].sort()
  const start = months[0]
  const end = months[months.length - 1]

  if (start === end) {
    return `${slug}-${start}.${format}`
  }

  return `${slug}-${start}-to-${end}.${format}`
}

export async function exportReportRows(format: ReportExportFormat, payload: ReportExportPayload) {
  return format === 'pdf' ? exportPdfReport(payload) : exportXlsxReport(payload)
}

function exportPdfReport({ title, rows }: ReportExportPayload) {
  const filename = buildReportExportFilename('pdf', title, rows)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(16)
  doc.text(title, 40, 40)
  doc.setFontSize(10)
  doc.text(`Generated ${new Date().toLocaleString('en-US')}`, 40, 58)

  autoTable(doc, {
    startY: 76,
    head: [[
      'Month',
      'Orders',
      'Revenue',
      'Cost of goods sold',
      'Gross profit',
      'Average order value',
    ]],
    body: rows.map((row) => [
      formatReportingMonth(row.month),
      row.orderCount.toLocaleString('en-US'),
      formatTHB(row.revenue),
      formatTHB(row.costOfGoodsSold),
      formatTHB(row.grossProfit),
      formatTHB(row.averageOrderValue),
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [24, 226, 153],
      textColor: 17,
    },
    alternateRowStyles: {
      fillColor: [246, 246, 246],
    },
    margin: { left: 40, right: 40 },
    tableWidth: pageWidth - 80,
  })

  doc.save(filename)
}

async function exportXlsxReport({ title, rows }: ReportExportPayload) {
  const filename = buildReportExportFilename('xlsx', title, rows)
  const worksheetRows = rows.map((row) => ({
    Month: formatReportingMonth(row.month),
    Orders: row.orderCount,
    Revenue: formatTHB(row.revenue),
    'Cost of goods sold': formatTHB(row.costOfGoodsSold),
    'Gross profit': formatTHB(row.grossProfit),
    'Average order value': formatTHB(row.averageOrderValue),
  }))

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Report')
  worksheet.columns = [
    { header: 'Month', key: 'Month' },
    { header: 'Orders', key: 'Orders' },
    { header: 'Revenue', key: 'Revenue' },
    { header: 'Cost of goods sold', key: 'Cost of goods sold' },
    { header: 'Gross profit', key: 'Gross profit' },
    { header: 'Average order value', key: 'Average order value' },
  ]

  worksheetRows.forEach((row) => worksheet.addRow(row))

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBuffer(buffer as ArrayBuffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

function downloadBuffer(buffer: ArrayBuffer, filename: string, mimeType: string) {
  const blob = new Blob([buffer], { type: mimeType })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.click()

  URL.revokeObjectURL(objectUrl)
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

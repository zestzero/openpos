import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const autoTable = vi.fn()
  const save = vi.fn()
  const setFontSize = vi.fn()
  const text = vi.fn()
  const jsPDF = vi.fn(function JsPDFMock() {
    return {
    internal: {
      pageSize: {
        getWidth: () => 842,
      },
    },
    save,
    setFontSize,
    text,
    }
  })

  const writeBuffer = vi.fn(async () => new ArrayBuffer(8))
  const addRow = vi.fn()
  const addWorksheet = vi.fn(() => ({
    addRow,
    addWorksheet: vi.fn(),
  }))

  const Workbook = vi.fn(function WorkbookMock() {
    return {
      addWorksheet,
      xlsx: {
        writeBuffer,
      },
    }
  })

  return {
    autoTable,
    save,
    setFontSize,
    text,
    jsPDF,
    addRow,
    addWorksheet,
    writeBuffer,
    Workbook,
  }
})

vi.mock('jspdf', () => ({
  jsPDF: mocks.jsPDF,
}))

vi.mock('jspdf-autotable', () => ({
  default: mocks.autoTable,
}))

vi.mock('exceljs', () => ({
  default: {
    Workbook: mocks.Workbook,
  },
}))

import { buildReportExportFilename, exportReportRows } from '../reports/exportReport'

const rows = [
  {
    month: '2026-04',
    orderCount: 42,
    revenue: 125000,
    costOfGoodsSold: 76000,
    grossProfit: 49000,
    averageOrderValue: 2976,
  },
  {
    month: '2026-03',
    orderCount: 35,
    revenue: 98000,
    costOfGoodsSold: 64000,
    grossProfit: 34000,
    averageOrderValue: 2800,
  },
] as const

describe('report export helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(globalThis.URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:report-export'),
    })
    Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('builds filenames from empty, single-month, and ranged report rows', () => {
    expect(buildReportExportFilename('pdf', 'Monthly sales and gross profit', [])).toBe('monthly-sales-and-gross-profit.pdf')
    expect(buildReportExportFilename('xlsx', 'Monthly sales and gross profit', [{ month: '2026-04' }])).toBe(
      'monthly-sales-and-gross-profit-2026-04.xlsx',
    )
    expect(buildReportExportFilename('pdf', 'Monthly sales and gross profit', [{ month: '2026-04' }, { month: '2026-03' }])).toBe(
      'monthly-sales-and-gross-profit-2026-03-to-2026-04.pdf',
    )
  })

  it('exports pdf rows with THB-formatted values and a visible filename', () => {
    exportReportRows('pdf', {
      title: 'Monthly sales and gross profit',
      rows: [...rows] as unknown as never,
    })

    expect(mocks.jsPDF).toHaveBeenCalledWith({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    expect(mocks.autoTable).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        head: [[
          'Month',
          'Orders',
          'Revenue',
          'Cost of goods sold',
          'Gross profit',
          'Average order value',
        ]],
        body: [
          ['Apr 2026', '42', '฿1,250.00', '฿760.00', '฿490.00', '฿29.76'],
          ['Mar 2026', '35', '฿980.00', '฿640.00', '฿340.00', '฿28.00'],
        ],
      }),
    )
    expect(mocks.save).toHaveBeenCalledWith('monthly-sales-and-gross-profit-2026-03-to-2026-04.pdf')
  })

  it('exports xlsx rows with THB-formatted worksheet data and downloads the file', async () => {
    const anchor = {
      click: vi.fn(),
      download: '',
      href: '',
      rel: '',
    } as unknown as HTMLAnchorElement
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor)

    await exportReportRows('xlsx', {
      title: 'Monthly sales and gross profit',
      rows: [...rows] as unknown as never,
    })

    expect(mocks.addWorksheet).toHaveBeenCalledWith('Report')
    expect(mocks.addRow).toHaveBeenCalledTimes(2)
    expect(mocks.addRow).toHaveBeenNthCalledWith(1, {
      Month: 'Apr 2026',
      Orders: 42,
      Revenue: '฿1,250.00',
      'Cost of goods sold': '฿760.00',
      'Gross profit': '฿490.00',
      'Average order value': '฿29.76',
    })
    expect(mocks.addRow).toHaveBeenNthCalledWith(2, {
      Month: 'Mar 2026',
      Orders: 35,
      Revenue: '฿980.00',
      'Cost of goods sold': '฿640.00',
      'Gross profit': '฿340.00',
      'Average order value': '฿28.00',
    })
    expect(mocks.writeBuffer).toHaveBeenCalledTimes(1)
    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(anchor.download).toBe('monthly-sales-and-gross-profit-2026-03-to-2026-04.xlsx')
    expect(anchor.click).toHaveBeenCalledTimes(1)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:report-export')
  })

})

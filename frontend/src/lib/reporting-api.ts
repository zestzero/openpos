import { getToken } from '@/lib/auth'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export interface MonthlySalesReport {
  month: string
  order_count: number
  total_revenue: number
  average_order_value: number
}

export interface GrossProfitReport {
  month: string
  order_count: number
  revenue: number
  cost_of_goods_sold: number
  gross_profit: number
}

export interface ReportingMonthRow {
  month: string
  orderCount: number
  revenue: number
  costOfGoodsSold: number
  grossProfit: number
  averageOrderValue: number
}

export interface ReportingSummary {
  current: ReportingMonthRow
  previous: ReportingMonthRow | null
  rows: ReportingMonthRow[]
}

export interface ApiSuccess<T> {
  data: T
}

export class ReportingApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ReportingApiError'
    this.status = status
  }
}

async function requestJSON<T>(path: string): Promise<ApiSuccess<T>> {
  const headers = new Headers({ Accept: 'application/json' })
  const token = getToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(new URL(path, apiBaseUrl).toString(), { headers })
  const text = await response.text()
  const payload = text ? safeParseJSON(text) : null

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : response.statusText || 'Request failed'

    throw new ReportingApiError(message, response.status)
  }

  return payload as ApiSuccess<T>
}

function safeParseJSON(text: string) {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function parseMonth(month: string) {
  const [year, monthNumber] = month.split('-').map((part) => Number(part))

  if (!year || !monthNumber) return null

  return new Date(Date.UTC(year, monthNumber - 1, 1))
}

export function formatReportingMonth(month: string) {
  const parsed = parseMonth(month)

  if (!parsed) return month

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

export function mergeReportingRows(
  monthlySales: MonthlySalesReport[],
  grossProfit: GrossProfitReport[],
) {
  const rowsByMonth = new Map<string, ReportingMonthRow>()

  monthlySales.forEach((row) => {
    rowsByMonth.set(row.month, {
      month: row.month,
      orderCount: row.order_count,
      revenue: row.total_revenue,
      costOfGoodsSold: 0,
      grossProfit: 0,
      averageOrderValue: row.average_order_value,
    })
  })

  grossProfit.forEach((row) => {
    const existing = rowsByMonth.get(row.month)

    rowsByMonth.set(row.month, {
      month: row.month,
      orderCount: row.order_count,
      revenue: row.revenue,
      costOfGoodsSold: row.cost_of_goods_sold,
      grossProfit: row.gross_profit,
      averageOrderValue: existing?.averageOrderValue ?? 0,
    })
  })

  return Array.from(rowsByMonth.values()).sort((left, right) => right.month.localeCompare(left.month))
}

export function summarizeReportingRows(rows: ReportingMonthRow[]): ReportingSummary | null {
  if (!rows.length) return null

  return {
    current: rows[0],
    previous: rows[1] ?? null,
    rows,
  }
}

export const reportingApi = {
  getMonthlySales() {
    return requestJSON<MonthlySalesReport[]>('/api/reports/monthly-sales')
  },
  getGrossProfit() {
    return requestJSON<GrossProfitReport[]>('/api/reports/gross-profit')
  },
}

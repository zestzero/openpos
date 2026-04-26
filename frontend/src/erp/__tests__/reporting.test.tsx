import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReportDashboard } from '../reports/ReportDashboard'
import { ReportChart } from '../reports/ReportChart'
import { mergeReportingRows, reportingApi } from '@/lib/reporting-api'

vi.mock('@/lib/reporting-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/reporting-api')>()

  return {
    ...actual,
    reportingApi: {
      ...actual.reportingApi,
      getMonthlySales: vi.fn(),
      getGrossProfit: vi.fn(),
    },
  }
})

const monthlySales = [
  {
    month: '2026-04',
    order_count: 42,
    total_revenue: 125000,
    average_order_value: 2976,
  },
  {
    month: '2026-03',
    order_count: 35,
    total_revenue: 98000,
    average_order_value: 2800,
  },
]

const grossProfit = [
  {
    month: '2026-04',
    order_count: 42,
    revenue: 125000,
    cost_of_goods_sold: 76000,
    gross_profit: 49000,
  },
  {
    month: '2026-03',
    order_count: 35,
    revenue: 98000,
    cost_of_goods_sold: 64000,
    gross_profit: 34000,
  },
]

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ReportDashboard />
    </QueryClientProvider>,
  )
}

describe('reporting dashboard', () => {
  beforeEach(() => {
    vi.mocked(reportingApi.getMonthlySales).mockResolvedValue({ data: monthlySales })
    vi.mocked(reportingApi.getGrossProfit).mockResolvedValue({ data: grossProfit })
  })

  it('renders the latest monthly sales and gross profit figures in THB', async () => {
    renderDashboard()

    expect(await screen.findByText('Monthly sales and gross profit')).toBeInTheDocument()
    expect(await screen.findByText('฿1,250.00')).toBeInTheDocument()
    expect(await screen.findByText('฿490.00')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '42 orders' })).toBeInTheDocument()
    expect((await screen.findAllByText('Apr 2026')).length).toBeGreaterThan(0)
  })

  it('shows the chart panel with merged monthly data', async () => {
    renderDashboard()

    expect(await screen.findByRole('region', { name: 'Monthly trend' })).toBeInTheDocument()

    expect((await screen.findAllByText('Mar 2026')).length).toBeGreaterThan(0)
    expect(await screen.findByText(/฿980\.00/)).toBeInTheDocument()
    expect(await screen.findByText(/฿340\.00/)).toBeInTheDocument()
  })

  it('renders the chart panel directly from merged dashboard rows', () => {
    render(<ReportChart rows={mergeReportingRows(monthlySales, grossProfit)} />)

    expect(screen.getByRole('region', { name: 'Monthly trend' })).toBeInTheDocument()
    expect(screen.getByText('Revenue ฿1,250.00')).toBeInTheDocument()
    expect(screen.getByText('Gross profit ฿490.00')).toBeInTheDocument()
  })
})

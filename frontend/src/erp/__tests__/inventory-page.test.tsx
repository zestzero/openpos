import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InventoryPage } from '../inventory/InventoryPage'

const useProductsQuery = vi.hoisted(() => vi.fn())
const useInventoryStockLevelQuery = vi.hoisted(() => vi.fn())
const useInventoryLedgerQuery = vi.hoisted(() => vi.fn())
const useAdjustStockMutation = vi.hoisted(() => vi.fn())

vi.mock('@/lib/erp-api', () => ({
  useProductsQuery,
  useInventoryStockLevelQuery,
  useInventoryLedgerQuery,
  useAdjustStockMutation,
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const productRecords = [
  {
    product: { id: 'prod-1', name: 'Jasmine Tea' },
    category: { id: 'cat-1', name: 'Tea' },
    variants: [
      { id: 'var-1', sku: 'TEA-001', name: 'Large', stockLevel: 12 },
      { id: 'var-2', sku: 'TEA-002', name: 'Small', stockLevel: 0 },
    ],
  },
]

function selectOption(name: string) {
  const option = screen.getByRole('option', { name })
  fireEvent.mouseMove(option)
  fireEvent.pointerEnter(option, { pointerType: 'mouse' })
  fireEvent.pointerDown(option, { pointerType: 'mouse', button: 0 })
  fireEvent.click(option)
}

describe('InventoryPage', () => {
  beforeEach(() => {
    useProductsQuery.mockReturnValue({ data: productRecords, isLoading: false, isError: false })
    useInventoryStockLevelQuery.mockImplementation((variantId: string | null) => ({ data: variantId === 'var-1' ? { stock_level: 0 } : { stock_level: 0 } }))
    useInventoryLedgerQuery.mockImplementation((variantId: string | null) => ({
      data: variantId === 'var-1'
        ? [{ id: 'entry-1', variant_id: 'var-1', quantity_change: 5, reason: 'RESTOCK', reference_id: null, created_at: '2026-01-01T10:00:00Z', created_by: null }]
        : [],
    }))
    useAdjustStockMutation.mockReturnValue({ isPending: false, mutateAsync: vi.fn().mockResolvedValue({}) })
  })

  it('shows loading, error, and empty states', () => {
    useProductsQuery.mockReturnValue({ isLoading: true, isError: false, data: [] })
    const { rerender } = render(<InventoryPage />)
    expect(screen.getByText('Loading inventory…')).toBeInTheDocument()

    useProductsQuery.mockReturnValue({ isLoading: false, isError: true, error: new Error('boom'), data: [] })
    rerender(<InventoryPage />)
    expect(screen.getByText(/Failed to load inventory/)).toBeInTheDocument()

    useProductsQuery.mockReturnValue({ isLoading: false, isError: false, data: [] })
    rerender(<InventoryPage />)
    expect(screen.getByText('No stocked variants are available yet.')).toBeInTheDocument()
  })

  it('auto-selects the first variant and renders stock and ledger', async () => {
    render(<InventoryPage />)

    await waitFor(() => expect(screen.getByText('Current stock:')).toBeInTheDocument())
    expect(screen.getAllByText('0')[0]).toBeInTheDocument()
    expect(screen.getByText('Restock')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument()
  })

  it('prefers the ledger-derived selected stock query over product cache stock', async () => {
    render(<InventoryPage />)

    await waitFor(() => expect(screen.getByText('Current stock:')).toBeInTheDocument())
    expect(screen.getAllByText('0')[0]).toBeInTheDocument()
  })

  it('keeps filter-empty distinct from true empty', async () => {
    render(<InventoryPage />)

    await waitFor(() => expect(screen.getByText('Current stock:')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Search variants'), { target: { value: 'missing' } })
    expect(screen.getByText('No variants match the current filters.')).toBeInTheDocument()
  })

  it('submits adjustments through the mutation path', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    useAdjustStockMutation.mockReturnValue({ isPending: false, mutateAsync })

    render(<InventoryPage />)

    await waitFor(() => expect(screen.getByText('Current stock:')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Save adjustment' }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ variantId: 'var-1', quantity: 1, reason: 'ADJUSTMENT' }))
  })

  it('preserves inventory dropdown labels, values, and adjustment reason behavior', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    useAdjustStockMutation.mockReturnValue({ isPending: false, mutateAsync })
    render(<InventoryPage />)

    await waitFor(() => expect(screen.getByText('Current stock:')).toBeInTheDocument())
    const stockFilter = screen.getByRole('combobox', { name: 'Stock state filter' })
    const reason = screen.getByRole('combobox', { name: 'Reason code' })
    const ledgerReason = screen.getByRole('combobox', { name: 'Ledger reason filter' })
    const ledgerTime = screen.getByRole('combobox', { name: 'Ledger time range' })

    expect(stockFilter).toHaveTextContent('All stock states')
    expect(reason).toHaveTextContent('Adjustment')
    expect(ledgerReason).toHaveTextContent('All reasons')
    fireEvent.click(stockFilter)
    selectOption('Low stock')
    expect(screen.getByText('0 of 2 variants')).toBeInTheDocument()
    fireEvent.click(stockFilter)
    selectOption('All stock states')

    fireEvent.click(ledgerReason)
    selectOption('Restock')
    fireEvent.click(ledgerTime)
    selectOption('Last 24 hours')
    fireEvent.click(screen.getByRole('button', { name: 'Clear ledger filters' }))
    expect(ledgerReason).toHaveTextContent('All reasons')
    expect(ledgerTime).toHaveTextContent('All time')

    fireEvent.click(reason)
    selectOption('Damage')
    expect(reason).toHaveTextContent('Damage')
    fireEvent.click(screen.getByRole('button', { name: 'Save adjustment' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ variantId: 'var-1', quantity: 1, reason: 'DAMAGE' }))

  })

  it('disables the adjustment reason while a stock mutation is pending', async () => {
    useAdjustStockMutation.mockReturnValue({ isPending: true, mutateAsync: vi.fn() })
    render(<InventoryPage />)

    await waitFor(() => expect(screen.getByText('Current stock:')).toBeInTheDocument())
    expect(screen.getByRole('combobox', { name: 'Reason code' })).toBeDisabled()
  })
})

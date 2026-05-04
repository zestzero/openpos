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

    await waitFor(() => expect(screen.getByText('Current stock: 12')).toBeInTheDocument())
    expect(screen.getByText('RESTOCK')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument()
  })

  it('prefers the product cache stock over a stale selected stock query', async () => {
    render(<InventoryPage />)

    await waitFor(() => expect(screen.getByText('Current stock: 12')).toBeInTheDocument())
  })

  it('keeps filter-empty distinct from true empty', async () => {
    render(<InventoryPage />)

    await waitFor(() => expect(screen.getByText('Current stock: 12')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Search variants'), { target: { value: 'missing' } })
    expect(screen.getByText('No variants match the current filters.')).toBeInTheDocument()
  })

  it('submits adjustments through the mutation path', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    useAdjustStockMutation.mockReturnValue({ isPending: false, mutateAsync })

    render(<InventoryPage />)

    await waitFor(() => expect(screen.getByText('Current stock: 12')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Save adjustment' }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ variantId: 'var-1', quantity: 1, reason: 'ADJUSTMENT' }))
  })
})

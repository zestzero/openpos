import { fireEvent, render, screen } from '@testing-library/react'
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

describe('InventoryPage', () => {
  beforeEach(() => {
    useProductsQuery.mockReturnValue({ data: [
      {
        product: { id: 'prod-1', name: 'Jasmine Tea' },
        category: { id: 'cat-1', name: 'Tea' },
        variants: [
          { id: 'var-1', sku: 'TEA-001', name: 'Large', stockLevel: 12 },
          { id: 'var-2', sku: 'TEA-002', name: 'Small', stockLevel: 0 },
        ],
      },
    ] })
    useInventoryStockLevelQuery.mockReturnValue({ data: { stock_level: 12 } })
    useInventoryLedgerQuery.mockReturnValue({ data: [{ id: 'entry-1', variant_id: 'var-1', quantity_change: 5, reason: 'RESTOCK', reference_id: null, created_at: '2026-01-01T10:00:00Z', created_by: null }] })
    useAdjustStockMutation.mockReturnValue({ isPending: false, mutateAsync: vi.fn().mockResolvedValue({}) })
  })

  it('shows variant stock, selected ledger history, and adjustment controls', () => {
    render(<InventoryPage />)

    expect(screen.getByLabelText('Search variants')).toBeInTheDocument()
    expect(screen.getByLabelText('Stock state filter')).toBeInTheDocument()
    expect(screen.getByText(/Low stock \(0\)/)).toBeInTheDocument()
    expect(screen.getByText(/Zero stock \(1\)/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Large/ }))

    expect(screen.getByText('Current stock: 12')).toBeInTheDocument()
    expect(screen.getByText('RESTOCK')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument()
    expect(screen.getByLabelText('Reason note')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Ledger reason filter'), { target: { value: 'ADJUSTMENT' } })
    expect(screen.getByText('No ledger entries match the current filters.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Stock state filter'), { target: { value: 'zero' } })
    expect(screen.getByText('Small')).toBeInTheDocument()
  })
})

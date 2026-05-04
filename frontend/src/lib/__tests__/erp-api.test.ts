import { beforeEach, describe, expect, it, vi } from 'vitest'

const invalidateQueries = vi.fn()
const setQueryData = vi.fn()
const useQueryClient = vi.fn(() => ({ invalidateQueries, setQueryData }))
const useMutation = vi.fn((options: any) => options)

vi.mock('@tanstack/react-query', () => ({ useMutation, useQuery: vi.fn(), useQueryClient }))
vi.mock('@/lib/auth', () => ({ getToken: vi.fn(() => null) }))

describe('useAdjustStockMutation', () => {
  beforeEach(() => {
    invalidateQueries.mockReset()
    setQueryData.mockReset()
    useMutation.mockClear()
  })

  it('updates inventory and products caches after adjustment', async () => {
    const { useAdjustStockMutation } = await import('@/lib/erp-api')
    const mutation = useAdjustStockMutation() as any

    await mutation.onSuccess?.({
      id: 'entry-1',
      variant_id: 'var-1',
      quantity_change: 3,
      reason: 'RESTOCK',
      reference_id: null,
      created_at: '2026-01-01T00:00:00Z',
      created_by: null,
    }, { variantId: 'var-1', quantity: 3, reason: 'RESTOCK' })

    expect(setQueryData).toHaveBeenCalledWith(['erp', 'inventory', 'stock', 'var-1'], expect.any(Function))
    expect(setQueryData).toHaveBeenCalledWith(['erp', 'inventory', 'ledger', 'var-1'], expect.any(Function))
    expect(setQueryData).toHaveBeenCalledWith(['erp', 'products'], expect.any(Function))
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['erp', 'inventory'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['erp', 'products'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['erp', 'inventory', 'stock', 'var-1'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['erp', 'inventory', 'ledger', 'var-1'] })
  })
})

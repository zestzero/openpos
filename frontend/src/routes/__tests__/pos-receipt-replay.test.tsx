import { render, screen, waitFor } from '@testing-library/react'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getReceipt: vi.fn(),
  printReceipt: vi.fn(),
  useCart: vi.fn(),
  useNetworkStatus: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    status: number

    constructor(message: string, status = 404) {
      super(message)
      this.status = status
    }
  },
  api: {
    getReceipt: mocks.getReceipt,
  },
}))

vi.mock('@/lib/receipt', () => ({
  printReceipt: mocks.printReceipt,
}))

vi.mock('@/pos/hooks/useNetworkStatus', () => ({
  useNetworkStatus: mocks.useNetworkStatus,
}))

vi.mock('@/pos/hooks/useCart', () => ({
  useCart: mocks.useCart,
}))

vi.mock('@/pos/components/SearchBar', () => ({
  SearchBar: () => <div>Search bar</div>,
}))

vi.mock('@/pos/components/CatalogCategoryNav', () => ({
  CatalogCategoryNav: () => <nav aria-label="Product categories">Categories</nav>,
}))

vi.mock('@/pos/components/CatalogGrid', () => ({
  CatalogGrid: () => <section aria-label="Catalog grid">Catalog grid</section>,
}))

vi.mock('@/pos/components/QuickKeysBar', () => ({
  QuickKeysBar: () => <section>Quick keys bar</section>,
}))

vi.mock('@/pos/components/CartPanel', () => ({
  CartPanel: () => <aside>Cart panel</aside>,
}))

vi.mock('@/pos/layout/PosLayout', () => ({
  PosLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

import { STORAGE_KEY_LATEST_RECEIPT } from '@/lib/constants'
import { PosRoute } from '../pos'
import { LatestReceiptReprint } from '@/pos/components/LatestReceiptReprint'
import { useLatestReceipt } from '@/pos/hooks/useLatestReceipt'

const receiptSnapshot = {
  store_name: 'OpenPOS Demo',
  paid_at: '2026-05-03T07:10:00Z',
  order_id: 'order-123',
  items: [],
  discount_amount: 0,
  total_amount: 12000,
  payment_method: 'cash' as const,
  tendered_amount: 12000,
  change_due: 0,
}

describe('pos receipt replay', () => {
  beforeEach(() => {
    localStorage.clear()
    mocks.getReceipt.mockReset()
    mocks.printReceipt.mockReset()
    mocks.useCart.mockReturnValue({
      items: [],
      itemCount: 0,
      total: 0,
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      isEmpty: true,
    })
    mocks.useNetworkStatus.mockReturnValue({ isOnline: true })
    mocks.getReceipt.mockResolvedValue({ data: receiptSnapshot })
    mocks.printReceipt.mockResolvedValue(undefined)
  })

  it('reprints the latest persisted receipt through the backend endpoint before printing', async () => {
    localStorage.setItem(STORAGE_KEY_LATEST_RECEIPT, 'order-123')

    const { result } = renderHook(() => useLatestReceipt())

    await act(async () => {
      await result.current.reprintLatestReceipt()
    })

    expect(mocks.getReceipt).toHaveBeenCalledWith('order-123')
    expect(mocks.printReceipt).toHaveBeenCalledWith(receiptSnapshot)
    expect(mocks.getReceipt.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.printReceipt.mock.invocationCallOrder[0],
    )
  })

  it('disables reprint while offline and never calls the receipt endpoint', async () => {
    localStorage.setItem(STORAGE_KEY_LATEST_RECEIPT, 'order-123')
    mocks.useNetworkStatus.mockReturnValue({ isOnline: false })

    render(<LatestReceiptReprint />)

    const button = screen.getByRole('button', { name: 'Reprint receipt' })
    expect(button).toBeDisabled()

    await act(async () => {
      button.click()
    })

    expect(mocks.getReceipt).not.toHaveBeenCalled()
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })

  it('shows non-destructive copy when persisted receipt lookup fails and stays on POS', async () => {
    localStorage.setItem(STORAGE_KEY_LATEST_RECEIPT, 'order-404')
    mocks.getReceipt.mockRejectedValueOnce(new Error('receipt missing'))

    render(<PosRoute />)

    await screen.findByRole('button', { name: 'Reprint receipt' })
    await act(async () => {
      screen.getByRole('button', { name: 'Reprint receipt' }).click()
    })

    await waitFor(() => {
      expect(screen.getByText(/receipt unavailable/i)).toBeInTheDocument()
    })
    expect(screen.getByText('Search bar')).toBeInTheDocument()
    expect(screen.queryByText(/reopen sale/i)).not.toBeInTheDocument()
  })

  it('does not render reopen-sale wording or a recent-orders list', () => {
    render(<PosRoute />)

    expect(screen.queryByText(/reopen sale/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /recent orders/i })).not.toBeInTheDocument()
  })
})

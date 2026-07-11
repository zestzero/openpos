import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  useCart: vi.fn(),
  useNetworkStatus: vi.fn(),
  queueOrder: vi.fn(),
  createOrder: vi.fn(),
  completePayment: vi.fn(),
  printReceipt: vi.fn(),
}))

vi.mock('@/pos/hooks/useCart', () => ({ useCart: mocks.useCart }))
vi.mock('@/pos/hooks/useNetworkStatus', () => ({ useNetworkStatus: mocks.useNetworkStatus }))
vi.mock('@/pos/hooks/useOfflineOrders', () => ({ useOfflineOrders: () => ({ queueOrder: mocks.queueOrder }) }))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'user-1', name: 'Cashier' } }) }))
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return { ...actual, api: { ...actual.api, createOrder: mocks.createOrder, completePayment: mocks.completePayment } }
})
vi.mock('@/lib/receipt', () => ({ printReceipt: mocks.printReceipt }))
vi.mock('@/lib/promptpay', () => ({ buildPromptPayQrDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,qr') }))
vi.mock('@/pos/layout/PosLayout', () => ({
  PosLayout: ({ children, bottomAction }: { children: React.ReactNode; bottomAction?: React.ReactNode }) => <div>{children}{bottomAction}</div>,
}))

import { __resetCheckoutSessionForTests } from '@/pos/hooks/usePosCheckoutSession'
import { CartPanel } from '../CartPanel'

const receipt = {
  store_name: 'OpenPOS', paid_at: '2026-07-10T10:00:00Z', order_id: 'server-order-1',
  items: [{ name: 'Americano', quantity: 1, unit_price: 12000, subtotal: 12000 }],
  discount_amount: 3000, total_amount: 9000, payment_method: 'cash' as const, tendered_amount: 10000, change_due: 1000,
}

function setReviewSession() {
  localStorage.setItem('openpos_pos_checkout', JSON.stringify({
    version: 2, orderId: 'client-order-1', stage: 'reviewing', discountAmount: 0,
    paymentMethod: 'cash', tenderedAmount: 12000, receipt: null, savedOffline: false, updatedAt: 0,
  }))
  __resetCheckoutSessionForTests()
}

describe('guided checkout', () => {
  const clearCart = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setReviewSession()
    mocks.useNetworkStatus.mockReturnValue({ isOnline: true })
    mocks.useCart.mockReturnValue({
      items: [{ variantId: 'variant-1', productName: 'Americano', variantName: 'Default', sku: 'AM-001', price: 12000, quantity: 1, subtotal: 12000 }],
      itemCount: 1, total: 12000, updateQuantity: vi.fn(), removeItem: vi.fn(), clearCart, isEmpty: false,
    })
    mocks.createOrder.mockResolvedValue({ data: { id: 'server-order-1' } })
    mocks.completePayment.mockResolvedValue({ data: receipt })
    mocks.printReceipt.mockResolvedValue(undefined)
  })

  it('applies a THB discount and moves through payment to the completion screen', async () => {
    render(<CartPanel />)

    fireEvent.click(screen.getByText('Add discount'))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Discount' }), { target: { value: '30' } })
    expect(screen.getByText('฿90.00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }))
    expect(screen.getByRole('heading', { name: 'Take payment' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '฿100.00' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm payment' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sale complete' })).toBeInTheDocument())
    expect(mocks.createOrder).toHaveBeenCalledTimes(1)
    expect(mocks.completePayment).toHaveBeenCalledWith('server-order-1', { method: 'cash', tendered_amount: 10000 })
    expect(clearCart).toHaveBeenCalledTimes(1)
    expect(screen.getByText('฿10.00')).toBeInTheDocument()
  })

  it('keeps the cart when an offline sale cannot be written to IndexedDB', async () => {
    mocks.useNetworkStatus.mockReturnValue({ isOnline: false })
    mocks.queueOrder.mockRejectedValue(new Error('storage full'))
    render(<CartPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save sale on this phone' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The sale was not saved')
    expect(clearCart).not.toHaveBeenCalled()
  })
})

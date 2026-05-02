import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  useCart: vi.fn(),
  useNetworkStatus: vi.fn(),
  usePosCheckoutSession: vi.fn(),
}))

let updateSessionMock: ReturnType<typeof vi.fn>

vi.mock('@/pos/hooks/useCart', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/pos/hooks/useCart')>()

  return {
    ...actual,
    useCart: mocks.useCart,
  }
})

vi.mock('@/pos/hooks/useNetworkStatus', () => ({
  useNetworkStatus: mocks.useNetworkStatus,
}))

vi.mock('@/pos/hooks/usePosCheckoutSession', () => ({
  usePosCheckoutSession: mocks.usePosCheckoutSession,
}))

vi.mock('../SyncStatus', () => ({
  SyncStatus: () => <div>Synced</div>,
}))

import { __resetCartStoreForTests } from '@/pos/hooks/useCart'
import { CartPanel } from '../CartPanel'

describe('CartPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetCartStoreForTests()

    updateSessionMock = vi.fn()

    mocks.useNetworkStatus.mockReturnValue({ isOnline: true })
    mocks.useCart.mockReturnValue({
      items: [
        {
          variantId: 'variant-1',
          productName: 'Americano',
          variantName: 'Americano',
          sku: 'AM-001',
          price: 12000,
          quantity: 1,
          subtotal: 12000,
        },
      ],
      itemCount: 1,
      total: 12000,
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
      isEmpty: false,
    })
    mocks.usePosCheckoutSession.mockReturnValue({
      session: {
        orderId: 'order-1',
        stage: 'building',
        discountAmount: 0,
        paymentMethod: 'cash',
        tenderedAmount: 0,
        updatedAt: 0,
      },
      startReview: vi.fn(),
      updateSession: updateSessionMock,
      clearSession: vi.fn(),
    })
  })

  it('treats discount input as THB and keeps confirm order button height consistent', () => {
    render(<CartPanel />)

    expect(screen.getByRole('button', { name: 'Complete order' })).toHaveClass('h-14')

    fireEvent.click(screen.getByRole('button', { name: 'Complete order' }))

    const discountInput = screen.getByRole('spinbutton', { name: 'Discount (THB)' })
    fireEvent.change(discountInput, { target: { value: '30' } })

    expect(screen.getByText('Total due')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm order' })).toHaveClass('h-14')

    fireEvent.click(screen.getByRole('button', { name: 'Confirm order' }))

    expect(updateSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        discountAmount: 3000,
        tenderedAmount: 9000,
      }),
    )

    expect(screen.getByRole('button', { name: 'Confirm payment' })).toHaveClass('h-14')
    expect(screen.getByRole('button', { name: 'Confirm payment' })).toHaveClass('bg-emerald-600')
  })
})

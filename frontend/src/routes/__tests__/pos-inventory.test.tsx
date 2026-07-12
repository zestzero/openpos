import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mocks = vi.hoisted(() => ({
  queueAdjustment: vi.fn(),
  getAllQueuedAdjustments: vi.fn(),
  syncPendingAdjustments: vi.fn(),
  useNetworkStatus: vi.fn(),
  useKeyboardWedge: vi.fn(),
  getProducts: vi.fn(),
  searchVariant: vi.fn(),
}))

vi.mock('@/pos/hooks/useOfflineAdjustments', () => ({
  useOfflineAdjustments: () => ({ queueAdjustment: mocks.queueAdjustment, getAllQueuedAdjustments: mocks.getAllQueuedAdjustments }),
}))
vi.mock('@/pos/hooks/useSync', () => ({ useSync: () => ({ syncPendingAdjustments: mocks.syncPendingAdjustments }) }))
vi.mock('@/pos/hooks/useNetworkStatus', () => ({ useNetworkStatus: mocks.useNetworkStatus }))
vi.mock('@/pos/hooks/useKeyboardWedge', () => ({ useKeyboardWedge: mocks.useKeyboardWedge }))
vi.mock('@/lib/api', () => ({ api: { getProducts: mocks.getProducts, searchVariant: mocks.searchVariant } }))
vi.mock('@/pos/components/BarcodeScanner', () => ({ BarcodeScanner: () => <div>Barcode scanner</div> }))
vi.mock('@/pos/layout/PosLayout', () => ({
  PosLayout: ({ children, bottomAction }: { children: React.ReactNode; bottomAction?: React.ReactNode }) => <div>{children}{bottomAction}</div>,
}))

import { PosInventoryRoute } from '../pos.inventory'

function renderRoute() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><PosInventoryRoute /></QueryClientProvider>)
}

const variant = {
  id: 'var-1', product_id: 'prod-1', sku: 'ESP-01', name: 'Default', price: 9000,
  cost: null, barcode: '885001', is_active: true, product_name: 'Espresso Blend',
}

describe('simplified inventory flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useNetworkStatus.mockReturnValue({ isOnline: true })
    mocks.getAllQueuedAdjustments.mockResolvedValue([])
    mocks.queueAdjustment.mockResolvedValue(undefined)
    mocks.syncPendingAdjustments.mockResolvedValue(undefined)
    mocks.getProducts.mockResolvedValue({ data: [{
      product: { id: 'prod-1', name: 'Espresso Blend', image_url: null, is_active: true },
      variants: [variant],
    }] })
    mocks.searchVariant.mockResolvedValue({ data: variant })
    mocks.useKeyboardWedge.mockReturnValue({ isEnabled: true, isScanning: false, toggle: vi.fn() })
  })

  it('shows only the find-or-scan starting task', async () => {
    renderRoute()
    expect(screen.getByRole('heading', { name: 'Adjust stock' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Product name, SKU, or barcode')).toBeInTheDocument()
    expect(screen.queryByText(/queue size/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/wedge/i)).not.toBeInTheDocument()
  })

  it('finds an item, edits quantity, reviews, and saves with the API reason code', async () => {
    renderRoute()
    fireEvent.change(screen.getByPlaceholderText('Product name, SKU, or barcode'), { target: { value: 'espr' } })
    fireEvent.click(await screen.findByRole('button', { name: /Espresso Blend/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }))
    expect(screen.getByRole('spinbutton', { name: 'Quantity change' })).toHaveValue(2)
    fireEvent.click(screen.getByRole('button', { name: 'Review before saving' }))
    expect(screen.getByText('+2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save stock adjustment' }))

    await waitFor(() => expect(mocks.queueAdjustment).toHaveBeenCalledWith(expect.objectContaining({
      variantId: 'var-1', quantity: 2, reason: 'RESTOCK',
    })))
    expect(await screen.findByRole('heading', { name: 'Adjustment saved' })).toBeInTheDocument()
    await waitFor(() => expect(mocks.syncPendingAdjustments).toHaveBeenCalledTimes(1))
  })

  it('moves directly to the same editor after a wedge scan', async () => {
    renderRoute()
    const onScan = mocks.useKeyboardWedge.mock.calls[0][0].onScan
    await act(async () => onScan('885001'))
    expect(await screen.findByRole('heading', { name: 'Espresso Blend' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Quantity change' })).toHaveValue(1)
  })

  it('saves offline without exposing synchronization terminology', async () => {
    mocks.useNetworkStatus.mockReturnValue({ isOnline: false })
    renderRoute()
    fireEvent.change(screen.getByPlaceholderText('Product name, SKU, or barcode'), { target: { value: 'espr' } })
    fireEvent.click(await screen.findByRole('button', { name: /Espresso Blend/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Review before saving' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save stock adjustment' }))

    expect(await screen.findByText(/Saved on this phone/)).toBeInTheDocument()
    expect(mocks.syncPendingAdjustments).not.toHaveBeenCalled()
  })
})

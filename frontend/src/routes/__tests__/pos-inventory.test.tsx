import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mocks = vi.hoisted(() => ({ queueAdjustment: vi.fn(), getAllQueuedAdjustments: vi.fn(), syncPendingAdjustments: vi.fn(), useNetworkStatus: vi.fn(), useKeyboardWedge: vi.fn(), getProducts: vi.fn(), searchVariant: vi.fn() }))
vi.mock('@/pos/hooks/useOfflineAdjustments', () => ({ useOfflineAdjustments: () => ({ queueAdjustment: mocks.queueAdjustment, getAllQueuedAdjustments: mocks.getAllQueuedAdjustments }) }))
vi.mock('@/pos/hooks/useSync', () => ({ useSync: () => ({ syncPendingAdjustments: mocks.syncPendingAdjustments }) }))
vi.mock('@/pos/hooks/useNetworkStatus', () => ({ useNetworkStatus: mocks.useNetworkStatus }))
vi.mock('@/pos/hooks/useKeyboardWedge', () => ({ useKeyboardWedge: mocks.useKeyboardWedge }))
vi.mock('@/lib/api', () => ({ api: { getProducts: mocks.getProducts, searchVariant: mocks.searchVariant } }))
vi.mock('@/pos/components/BarcodeScanner', () => ({ BarcodeScanner: () => <div>Barcode scanner</div> }))
vi.mock('@/pos/layout/PosLayout', () => ({ PosLayout: ({ children, bottomAction }: { children: React.ReactNode; bottomAction?: React.ReactNode }) => <div>{children}{bottomAction}</div> }))

import { PosInventoryRoute } from '../pos.inventory'

function renderRoute() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><PosInventoryRoute /></QueryClientProvider>)
}

const variant = { id: 'var-1', product_id: 'prod-1', sku: 'ESP-01', name: 'Default', price: 9000, cost: null, barcode: '885001', is_active: true, stockLevel: 12, product_name: 'Espresso Blend' }

describe('simplified inventory flow', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.useNetworkStatus.mockReturnValue({ isOnline: true }); mocks.getAllQueuedAdjustments.mockResolvedValue([]); mocks.queueAdjustment.mockResolvedValue(undefined); mocks.syncPendingAdjustments.mockResolvedValue(undefined); mocks.getProducts.mockResolvedValue({ data: [{ product: { id: 'prod-1', name: 'Espresso Blend', image_url: null, is_active: true }, variants: [variant] }] }); mocks.searchVariant.mockResolvedValue({ data: variant }); mocks.useKeyboardWedge.mockReturnValue({ isEnabled: true, isScanning: false, toggle: vi.fn() })
  })

  async function chooseBySearch() {
    fireEvent.change(screen.getByPlaceholderText('Search by name, SKU, or barcode'), { target: { value: 'espr' } })
    fireEvent.click(await screen.findByRole('button', { name: /Espresso Blend/ }))
  }

  it('shows scan as the primary starting task and hides queue details', () => {
    renderRoute(); expect(screen.getByRole('heading', { name: 'Adjust stock' })).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Scan barcode with camera' })).toBeInTheDocument(); expect(screen.queryByText(/queue size/i)).not.toBeInTheDocument()
  })

  it('saves directly from the editor with a signed delta and API reason code', async () => {
    renderRoute(); await chooseBySearch(); fireEvent.click(screen.getByRole('button', { name: 'Increase' })); fireEvent.click(screen.getByRole('button', { name: 'Save adjustment' }))
    await waitFor(() => expect(mocks.queueAdjustment).toHaveBeenCalledWith(expect.objectContaining({ variantId: 'var-1', quantity: 2, reason: 'RESTOCK' })))
    expect(await screen.findByRole('heading', { name: 'Adjustment saved' })).toBeInTheDocument(); await waitFor(() => expect(mocks.syncPendingAdjustments).toHaveBeenCalledTimes(1))
  })

  it('filters reasons for removal and blocks a negative resulting stock', async () => {
    renderRoute(); await chooseBySearch(); fireEvent.click(screen.getByRole('button', { name: 'Remove stock' })); expect(screen.getByRole('button', { name: 'Damaged' })).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Restock' })).not.toBeInTheDocument()
    for (let i = 0; i < 12; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
    expect(screen.getByText('Not enough stock for this removal')).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Save adjustment' })).toBeDisabled()
  })

  it('moves directly to the editor after a wedge scan without a negative input', async () => {
    renderRoute(); const onScan = mocks.useKeyboardWedge.mock.calls[0][0].onScan; await act(async () => onScan('885001')); expect(await screen.findByRole('heading', { name: 'Espresso Blend' })).toBeInTheDocument(); expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  it('saves offline without exposing synchronization terminology', async () => {
    mocks.useNetworkStatus.mockReturnValue({ isOnline: false }); renderRoute(); await chooseBySearch(); fireEvent.click(screen.getByRole('button', { name: 'Save adjustment' })); expect(await screen.findByText('Saved on this phone')).toBeInTheDocument(); expect(mocks.syncPendingAdjustments).not.toHaveBeenCalled()
  })
})

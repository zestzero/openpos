import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

const mocks = vi.hoisted(() => ({
  getStoredSession: vi.fn(),
  useAuth: vi.fn(),
  useOfflineAdjustments: vi.fn(),
  useSync: vi.fn(),
  useNetworkStatus: vi.fn(),
  useKeyboardWedge: vi.fn(),
  useNavigate: vi.fn(),
  useRouterState: vi.fn(),
  api: {
    getProducts: vi.fn(),
    searchVariant: vi.fn(),
  },
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
  return {
    ...actual,
    useNavigate: mocks.useNavigate,
    useRouterState: mocks.useRouterState,
  }
})

vi.mock('@/lib/auth', () => ({
  getStoredSession: mocks.getStoredSession,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mocks.useAuth,
}))

vi.mock('@/pos/hooks/useOfflineAdjustments', () => ({
  useOfflineAdjustments: mocks.useOfflineAdjustments,
}))

vi.mock('@/pos/hooks/useSync', () => ({
  useSync: mocks.useSync,
}))

vi.mock('@/pos/hooks/useNetworkStatus', () => ({
  useNetworkStatus: mocks.useNetworkStatus,
}))

vi.mock('@/pos/hooks/useKeyboardWedge', () => ({
  useKeyboardWedge: mocks.useKeyboardWedge,
}))

vi.mock('@/lib/api', () => ({
  api: mocks.api,
}))

// Mock BarcodeScanner to avoid canvas errors in tests
vi.mock('@/pos/components/BarcodeScanner', () => ({
  BarcodeScanner: () => <div data-testid="mock-barcode-scanner">Barcode Scanner</div>,
}))

// Mock PosNav to avoid router state errors in tests
vi.mock('@/pos/components/PosNav', () => ({
  PosNav: () => <div data-testid="mock-pos-nav">Mock Pos Nav</div>,
}))

import { PosInventoryRoute } from '../pos.inventory'

describe('POS Inventory Route', () => {
  const mockQueueAdjustment = vi.fn()
  const mockGetAllQueuedAdjustments = vi.fn().mockResolvedValue([])
  const mockClearAdjustment = vi.fn()
  const mockSyncPendingAdjustments = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mocks.getStoredSession.mockReturnValue({
      token: 'cashier-token',
      user: { name: 'Alex Cashier', email: 'alex@example.com', role: 'cashier' },
    })

    mocks.useRouterState.mockReturnValue('/pos/inventory')

    mocks.useAuth.mockReturnValue({
      user: { name: 'Alex Cashier', email: 'alex@example.com', role: 'cashier' },
      isLoading: false,
      isAuthenticated: true,
      hasRole: (role: string) => role === 'cashier',
      redirectPath: '/pos',
    })

    mocks.useOfflineAdjustments.mockReturnValue({
      queueAdjustment: mockQueueAdjustment,
      getAllQueuedAdjustments: mockGetAllQueuedAdjustments,
      clearAdjustment: mockClearAdjustment,
    })

    mocks.useSync.mockReturnValue({
      syncPendingAdjustments: mockSyncPendingAdjustments,
    })

    mocks.useNetworkStatus.mockReturnValue({ isOnline: true })

    mocks.useKeyboardWedge.mockReturnValue({
      isEnabled: true,
      lastScan: null,
      isScanning: false,
      toggle: vi.fn(),
    })

    mocks.api.getProducts.mockResolvedValue({
      data: [
        {
          product: { id: 'prod-1', name: 'Espresso Blend', is_active: true },
          variants: [
            { id: 'var-1', product_id: 'prod-1', sku: 'ESP-01', name: 'Default', price: 9000, barcode: '885001' },
          ],
        },
      ],
    })

    mocks.api.searchVariant.mockResolvedValue({
      data: { id: 'var-1', product_id: 'prod-1', sku: 'ESP-01', name: 'Default', price: 9000, barcode: '885001', product_name: 'Espresso Blend' },
    })
  })

  it('renders the inventory page structure', async () => {
    renderWithProviders(<PosInventoryRoute />)

    expect(screen.getByText('Scan and Adjust Stock Level.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Type product name, barcode, or SKU/i)).toBeInTheDocument()
    expect(screen.getByText('Draft Stock Adjustments')).toBeInTheDocument()
    expect(screen.getByText('Pending adjustments')).toBeInTheDocument()
  })

  it('adds adjustment to drafts and opens Dialog on scan', async () => {
    renderWithProviders(<PosInventoryRoute />)

    // Simulate Keyboard Wedge scan
    const onScan = mocks.useKeyboardWedge.mock.calls[0][0].onScan
    expect(onScan).toBeTypeOf('function')

    await onScan('885001')

    // Expect dialog to open
    expect(await screen.findByText('Record Stock Adjustment')).toBeInTheDocument()
    expect(screen.getByText('Espresso Blend')).toBeInTheDocument()

    // Fill dialog and submit
    const qtyInput = screen.getByLabelText(/Quantity Change/i)
    fireEvent.change(qtyInput, { target: { value: '5' } })

    const saveBtn = screen.getByRole('button', { name: /Save Adjustment/i })
    fireEvent.click(saveBtn)

    // Verify it is added to the drafts list and not queued/synced immediately
    await waitFor(() => {
      expect(screen.queryByText('Record Stock Adjustment')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Draft Stock Adjustments')).toBeInTheDocument()
    expect(screen.getByText('Espresso Blend')).toBeInTheDocument()
    expect(screen.getByText('+5')).toBeInTheDocument()

    expect(mockQueueAdjustment).not.toHaveBeenCalled()
    expect(mockSyncPendingAdjustments).not.toHaveBeenCalled()
  })

  it('allows manual product search and select from suggestions', async () => {
    renderWithProviders(<PosInventoryRoute />)

    const searchInput = screen.getByPlaceholderText(/Type product name, barcode, or SKU/i)
    fireEvent.change(searchInput, { target: { value: 'espr' } })

    // Wait for the suggestion item to appear
    await waitFor(() => {
      expect(screen.getByText('Espresso Blend')).toBeInTheDocument()
    })

    // Click suggestion to open adjustment dialog
    const suggestBtn = screen.getByRole('button', { name: /Espresso Blend/i })
    fireEvent.click(suggestBtn)

    expect(await screen.findByText('Record Stock Adjustment')).toBeInTheDocument()
  })

  it('commits draft adjustments and triggers sync', async () => {
    renderWithProviders(<PosInventoryRoute />)

    // 1. Trigger Wedge scan to add a draft
    const onScan = mocks.useKeyboardWedge.mock.calls[0][0].onScan
    await onScan('885001')

    // Wait for dialog to open
    expect(await screen.findByText('Record Stock Adjustment')).toBeInTheDocument()

    const saveBtn = screen.getByRole('button', { name: /Save Adjustment/i })
    fireEvent.click(saveBtn)

    // Wait for dialog to close
    await waitFor(() => {
      expect(screen.queryByText('Record Stock Adjustment')).not.toBeInTheDocument()
    })

    // 2. Open confirmation modal
    const reviewBtn = screen.getByRole('button', { name: /Review & Commit/i })
    fireEvent.click(reviewBtn)

    expect(await screen.findByText('Confirm Stock Adjustments')).toBeInTheDocument()
    expect(screen.getByText('Commit & Sync (1)')).toBeInTheDocument()

    // 3. Confirm adjustments
    const commitBtn = screen.getByRole('button', { name: /Commit & Sync/i })
    fireEvent.click(commitBtn)

    // Verify Dexie queue adjustment was called and drafts cleared
    await waitFor(() => {
      expect(mockQueueAdjustment).toHaveBeenCalledWith(
        expect.objectContaining({
          variantId: 'var-1',
          quantity: 1, // default quantity is 1
          reason: 'ADJUSTMENT',
        })
      )
    })

    await waitFor(() => {
      expect(screen.queryByText('Confirm Stock Adjustments')).not.toBeInTheDocument()
      expect(screen.getByText(/No draft adjustments in this session/i)).toBeInTheDocument()
      expect(mockSyncPendingAdjustments).toHaveBeenCalled()
    })
  })
})

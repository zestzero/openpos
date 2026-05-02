import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useCart: vi.fn(),
  useFavorites: vi.fn(),
  useNetworkStatus: vi.fn(),
  useKeyboardWedge: vi.fn(),
  usePosCheckoutSession: vi.fn(),
  useNavigate: vi.fn(),
  useRouterState: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mocks.useAuth,
}))

vi.mock('@/pos/hooks/useCart', () => ({
  useCart: mocks.useCart,
}))

vi.mock('@/pos/hooks/useFavorites', () => ({
  useFavorites: mocks.useFavorites,
}))

vi.mock('@/pos/hooks/useNetworkStatus', () => ({
  useNetworkStatus: mocks.useNetworkStatus,
}))

vi.mock('@/pos/hooks/useKeyboardWedge', () => ({
  useKeyboardWedge: mocks.useKeyboardWedge,
}))

vi.mock('@/pos/hooks/usePosCheckoutSession', () => ({
  usePosCheckoutSession: mocks.usePosCheckoutSession,
}))

vi.mock('@/pos/components/SearchBar', () => ({
  SearchBar: () => (
    <div>
      <label htmlFor="search-products">Search products</label>
      <input id="search-products" aria-label="Search products" />
    </div>
  ),
}))

vi.mock('@/pos/components/CatalogCategoryNav', () => ({
  CatalogCategoryNav: () => (
    <nav aria-label="Product categories">
      <button type="button">All items</button>
      <button type="button">Drinks</button>
    </nav>
  ),
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

vi.mock('@/pos/components/BarcodeScanner', () => ({
  BarcodeScanner: () => <section>Barcode scanner</section>,
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')

  return {
    ...actual,
    useNavigate: mocks.useNavigate,
    useRouterState: mocks.useRouterState,
  }
})

import { PosCatalogRoute } from '../pos.catalog'
import { PosRoute } from '../pos'
import { ScanPage } from '../pos.scan'

describe('POS shell routes', () => {
  beforeEach(() => {
    mocks.useAuth.mockReturnValue({
      user: { name: 'Alex Cashier', email: 'alex@example.com', role: 'cashier' },
    })
    mocks.useCart.mockReturnValue({
      items: [
        {
          variantId: 'variant-1',
          productName: 'Iced Latte',
          variantName: 'Iced Latte',
          sku: 'LATTE-001',
          price: 12000,
          quantity: 2,
          subtotal: 24000,
        },
      ],
      itemCount: 2,
      total: 24000,
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      isEmpty: false,
    })
    mocks.useFavorites.mockReturnValue({
      favorites: [
        {
          variantId: 'fav-1',
          productName: 'Iced Latte',
          variantName: 'Iced Latte',
          price: 12000,
          addCount: 4,
        },
      ],
      recordAdd: vi.fn(),
    })
    mocks.useNetworkStatus.mockReturnValue({ isOnline: true })
    mocks.useKeyboardWedge.mockReturnValue({
      isEnabled: true,
      lastScan: null,
      isScanning: false,
      toggle: vi.fn(),
    })
    mocks.usePosCheckoutSession.mockReturnValue({
      session: null,
      startReview: vi.fn(),
      updateSession: vi.fn(),
      clearSession: vi.fn(),
    })
    mocks.useNavigate.mockReturnValue(vi.fn())
    mocks.useRouterState.mockReturnValue('/pos')
  })

  it('shows the cashier selling floor shell', () => {
    render(<PosRoute />)

    expect(screen.getByRole('heading', { name: 'POS Terminal' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Search products' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Product categories' })).toBeInTheDocument()
    expect(screen.getByText('Quick keys bar')).toBeInTheDocument()
    expect(screen.getByText('Cart panel')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view cart/i })).toHaveAttribute('href', '#cart-panel')
    expect(screen.getByRole('button', { name: 'Selling' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Catalog' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Scan' })).toBeInTheDocument()
  })

  it('shows the dedicated catalog browsing shell', () => {
    render(<PosCatalogRoute />)

    expect(screen.getByRole('heading', { name: 'POS Terminal' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Product categories' })).toBeInTheDocument()
    expect(screen.getByLabelText('Catalog grid')).toBeInTheDocument()
  })

  it('shows the scanner lane and wedge controls', () => {
    render(<ScanPage />)

    expect(screen.getByRole('heading', { name: /Keep the cashier moving without leaving the sale\./i })).toBeInTheDocument()
    expect(screen.getByText('Barcode scanner')).toBeInTheDocument()
    expect(screen.getByText('Keyboard wedge active')).toBeInTheDocument()
    expect(screen.getByText('Current state')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to selling floor/i })).toBeInTheDocument()
  })
})

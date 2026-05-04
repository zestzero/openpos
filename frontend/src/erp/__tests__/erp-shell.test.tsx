import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErpLayout } from '../layout/ErpLayout'
import { ErpNav } from '../navigation/ErpNav'
import { Route as erpRoute } from '@/routes/erp'
import { Route as erpInventoryRoute } from '@/routes/erp.inventory'
import { Route as erpProductsRoute } from '@/routes/erp.products'

type TestRoute = {
  options: {
    path?: string
    getParentRoute?: () => unknown
    beforeLoad?: () => void
  }
}

const getStoredSession = vi.hoisted(() => vi.fn())
const getLandingPath = vi.hoisted(() => vi.fn())
const logout = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth', () => ({
  getStoredSession,
}))

vi.mock('@/hooks/useRbac', () => ({
  canAccessRoute: (role: string, route: string) => role === 'owner' && route === 'erp',
  getLandingPath,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    logout,
  }),
}))

describe('ERP shell', () => {
  beforeEach(() => {
    getStoredSession.mockReset()
    getLandingPath.mockReset()
    logout.mockReset()
  })

  it('renders the desktop navigation, utility bar, and tabs', () => {
    render(
      <ErpLayout>
        <div>Outlet content</div>
      </ErpLayout>,
    )

    expect(screen.getByText('OpenPOS ERP')).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'ERP workspace tabs' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Products' })).toHaveAttribute('href', '/erp/products')
    expect(screen.getByRole('tab', { name: 'Inventory' })).toHaveAttribute('href', '/erp/inventory')
    expect(screen.getByText('Outlet content')).toBeInTheDocument()
  })

  it('keeps the persistent left navigation visible', () => {
    render(<ErpNav />)

    expect(screen.getByText('Owner access only')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/erp')
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/erp/products')
    expect(screen.getByRole('link', { name: 'Inventory' })).toHaveAttribute('href', '/erp/inventory')
    expect(screen.getByRole('link', { name: 'Reports' })).toHaveAttribute('href', '/erp/reports')
  })

  it('includes the dedicated products route in the ERP route tree', () => {
    const productsRoute = erpProductsRoute as TestRoute

    expect(productsRoute.options.path).toBe('products')
    expect(productsRoute.options.getParentRoute?.()).toBe(erpRoute)
  })

  it('includes the dedicated inventory route in the ERP route tree', () => {
    const inventoryRoute = erpInventoryRoute as TestRoute

    expect(inventoryRoute.options.path).toBe('inventory')
    expect(inventoryRoute.options.getParentRoute?.()).toBe(erpRoute)
  })

  it('preserves the owner gate and redirects non-owners', () => {
    const beforeLoad = (erpRoute as TestRoute).options.beforeLoad

    expect(beforeLoad).toBeTypeOf('function')

    getStoredSession.mockReturnValue(null)
    expect(() => beforeLoad?.()).toThrow()

    getStoredSession.mockReturnValue({
      token: 'token',
      user: { id: '1', email: 'owner@example.com', role: 'owner', name: 'Owner' },
    })
    expect(() => beforeLoad?.()).not.toThrow()

    getStoredSession.mockReturnValue({
      token: 'token',
      user: { id: '2', email: 'cashier@example.com', role: 'cashier', name: 'Cashier' },
    })
    getLandingPath.mockReturnValue('/pos')
    expect(() => beforeLoad?.()).toThrow()
    expect(getLandingPath).toHaveBeenCalledWith('cashier')
  })

  it('shows sign out in the ERP header and triggers logout', () => {
    render(<ErpLayout><div>Outlet content</div></ErpLayout>)

    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))

    expect(logout).toHaveBeenCalledTimes(1)
  })
})

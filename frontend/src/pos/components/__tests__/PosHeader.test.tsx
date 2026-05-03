import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    logout: mocks.logout,
  }),
}))

import { PosHeader } from '../PosHeader'

describe('PosHeader', () => {
  beforeEach(() => {
    mocks.logout.mockReset()
  })

  it('shows a sign out action in the header', () => {
    render(<PosHeader user={{ id: '1', email: 'cashier@example.com', role: 'cashier', name: 'Cashier' }} online />)

    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('calls logout when sign out is clicked', () => {
    render(<PosHeader user={{ id: '1', email: 'cashier@example.com', role: 'cashier', name: 'Cashier' }} online />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(mocks.logout).toHaveBeenCalledTimes(1)
  })
})

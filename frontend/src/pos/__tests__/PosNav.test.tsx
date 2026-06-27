import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useNavigate: vi.fn(),
  useRouterState: vi.fn(),
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')

  return {
    ...actual,
    useNavigate: mocks.useNavigate,
    useRouterState: mocks.useRouterState,
  }
})

import { PosNav } from '../components/PosNav'

describe('PosNav', () => {
  beforeEach(() => {
    mocks.navigate.mockReset()
    mocks.useNavigate.mockReturnValue(mocks.navigate)
    mocks.useRouterState.mockReturnValue('/pos')
  })

  it('navigates to the cashier routes', () => {
    render(<PosNav />)

    expect(screen.getByRole('button', { name: 'Selling' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('button', { name: 'Catalog' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Scan' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inventory' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Inventory' }))

    expect(mocks.navigate).toHaveBeenCalledWith({ to: '/pos/inventory' })
  })
})

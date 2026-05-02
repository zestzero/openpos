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
    mocks.useRouterState.mockReturnValue('/pos/catalog')
  })

  it('navigates to the cashier routes', () => {
    render(<PosNav />)

    expect(screen.getByRole('button', { name: 'Selling' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Catalog' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Scan' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Scan' }))

    expect(mocks.navigate).toHaveBeenCalledWith({ to: '/pos/scan' })
  })
})

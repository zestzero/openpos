import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  navigate: vi.fn(),
  loginPassword: vi.fn(),
  loginPIN: vi.fn(),
  registerOwner: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mocks.login,
  }),
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')

  return {
    ...actual,
    useRouter: () => ({
      navigate: mocks.navigate,
    }),
  }
})

vi.mock('@/lib/api', () => ({
  api: {
    login: mocks.loginPassword,
    loginPIN: mocks.loginPIN,
    registerOwner: mocks.registerOwner,
  },
}))

import { LoginRoute } from '../login'

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('login route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.loginPassword.mockResolvedValue({
      user: { id: 'owner-1', email: 'owner@example.com', role: 'owner', name: 'Owner' },
      token: 'owner-token',
    })
    mocks.loginPIN.mockResolvedValue({
      user: { id: 'cashier-1', email: 'cashier@example.com', role: 'cashier', name: 'Cashier' },
      token: 'cashier-token',
    })
    mocks.registerOwner.mockResolvedValue({
      ID: 'owner-1',
      Email: 'owner@example.com',
      Role: 'owner',
      Name: 'Owner',
    })
  })

  it('routes registered owners into the ERP shell', async () => {
    renderWithQueryClient(<LoginRoute />)

    fireEvent.click(screen.getByRole('button', { name: 'Register owner' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'owner@example.com' } })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Owner' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create owner account' }))

    await waitFor(() => {
      expect(mocks.registerOwner).toHaveBeenCalledWith('owner@example.com', 'secret123', 'Owner')
      expect(mocks.loginPassword).toHaveBeenCalledWith('owner@example.com', 'secret123')
      expect(mocks.login).toHaveBeenCalledWith({
        user: { id: 'owner-1', email: 'owner@example.com', role: 'owner', name: 'Owner' },
        token: 'owner-token',
      })
      expect(mocks.navigate).toHaveBeenCalledWith({ to: '/erp', replace: true })
    })
  })

  it('routes owner password logins into the ERP shell', async () => {
    renderWithQueryClient(<LoginRoute />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'owner@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with password' }))

    await waitFor(() => {
      expect(mocks.loginPassword).toHaveBeenCalledWith('owner@example.com', 'secret123')
      expect(mocks.navigate).toHaveBeenCalledWith({ to: '/erp', replace: true })
    })
  })
})

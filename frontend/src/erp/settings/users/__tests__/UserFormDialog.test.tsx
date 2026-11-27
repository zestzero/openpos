import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserFormDialog } from '../UserFormDialog'

const { useCreateUserMutation, useUpdateUserMutation } = vi.hoisted(() => ({
  useCreateUserMutation: vi.fn(),
  useUpdateUserMutation: vi.fn(),
}))

vi.mock('@/lib/users-api', () => ({
  useCreateUserMutation,
  useUpdateUserMutation,
}))


function selectOption(name: string) {
  const option = screen.getByRole('option', { name })
  fireEvent.mouseMove(option)
  fireEvent.pointerEnter(option, { pointerType: 'mouse' })
  fireEvent.pointerDown(option, { pointerType: 'mouse', button: 0 })
  fireEvent.click(option)
}
describe('UserFormDialog', () => {
  beforeEach(() => {
    useCreateUserMutation.mockReturnValue({ isPending: false, mutateAsync: vi.fn() })
    useUpdateUserMutation.mockReturnValue({ isPending: false, mutateAsync: vi.fn() })
  })

  it('updates role and shows the matching credential field', () => {
    render(<UserFormDialog open onOpenChange={() => undefined} user={null} />)

    const role = screen.getByRole('combobox', { name: 'Role' })
    expect(role).toHaveTextContent('Cashier')
    expect(screen.getByLabelText('PIN')).toBeInTheDocument()

    fireEvent.click(role)
    selectOption('Owner')

    expect(role).toHaveTextContent('Owner')
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.queryByLabelText('PIN')).not.toBeInTheDocument()
  })
})

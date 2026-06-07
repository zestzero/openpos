import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { requestJSON } from '@/lib/api'

export interface UserRecord {
  id: string
  email: string
  name: string
  role: 'owner' | 'cashier'
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateUserValues {
  email: string
  password: string
  name: string
  role: 'owner' | 'cashier'
  pin?: string
}

export interface UpdateUserValues {
  email: string
  name: string
  role: 'owner' | 'cashier'
}

const usersQueryKey = ['users'] as const

async function listUsers(): Promise<UserRecord[]> {
  return requestJSON<UserRecord[]>('/api/users')
}

async function createUser(data: CreateUserValues): Promise<UserRecord> {
  return requestJSON<UserRecord>('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

async function updateUser(id: string, data: UpdateUserValues): Promise<UserRecord> {
  return requestJSON<UserRecord>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

async function toggleUserActive(id: string): Promise<UserRecord> {
  return requestJSON<UserRecord>(`/api/users/${id}/toggle-active`, {
    method: 'PATCH',
  })
}

export function useUsersQuery() {
  return useQuery({
    queryKey: usersQueryKey,
    queryFn: listUsers,
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserValues }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}

export function useToggleUserActiveMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleUserActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}

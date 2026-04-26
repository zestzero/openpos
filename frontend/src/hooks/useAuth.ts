import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  clearSession,
  getRedirectPath,
  getStoredSession,
  hasRole,
  persistSession,
  type AuthUser,
  type UserRole,
} from '@/lib/auth'
import type { AuthResponse } from '@/lib/api'

const authQueryKey = ['auth', 'session'] as const

async function loadSession() {
  return getStoredSession()
}

export function useAuth() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const sessionQuery = useQuery({
    queryKey: authQueryKey,
    queryFn: loadSession,
    initialData: getStoredSession(),
    staleTime: Infinity,
  })

  useEffect(() => {
    const session = getStoredSession()
    if (!session) {
      queryClient.setQueryData(authQueryKey, null)
      return
    }

    queryClient.setQueryData(authQueryKey, session)
  }, [queryClient])

  useEffect(() => {
    const token = getStoredSession()
    if (!token) {
      clearSession()
      queryClient.setQueryData(authQueryKey, null)
    }
  }, [queryClient])

  const login = (response: AuthResponse) => {
    const session = {
      token: response.token,
      user: response.user as AuthUser,
    }

    persistSession(session)
    queryClient.setQueryData(authQueryKey, session)
  }

  const logout = () => {
    clearSession()
    queryClient.setQueryData(authQueryKey, null)
    navigate({ to: '/login', replace: true })
  }

  return {
    user: sessionQuery.data?.user ?? null,
    isLoading: sessionQuery.isLoading,
    isAuthenticated: Boolean(sessionQuery.data?.user),
    login,
    logout,
    hasRole: (role: UserRole | UserRole[]) => {
      const user = sessionQuery.data?.user
      return user ? hasRole(user.role, role) : false
    },
    redirectPath: sessionQuery.data?.user ? getRedirectPath(sessionQuery.data.user.role) : '/login',
  }
}

import { useMemo } from 'react'

import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/lib/auth'

export type AppRoute = 'erp' | 'pos'

const routeAccess: Record<UserRole, AppRoute[]> = {
  owner: ['erp', 'pos'],
  cashier: ['pos'],
}

export function canAccessRoute(role: UserRole, route: AppRoute) {
  return routeAccess[role].includes(route)
}

export function getLandingPath(role: UserRole) {
  return role === 'owner' ? '/erp' : '/pos'
}

export function useRbac() {
  const { user, hasRole } = useAuth()

  return useMemo(() => {
    const role = user?.role ?? null

    return {
      role,
      isOwner: hasRole('owner'),
      canAccessErp: role ? canAccessRoute(role, 'erp') : false,
      canAccessPos: role ? canAccessRoute(role, 'pos') : false,
      getLandingPath: role ? getLandingPath(role) : '/login',
    }
  }, [hasRole, user?.role])
}

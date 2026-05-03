import { useMemo } from 'react'

import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/lib/auth'

export type AppRoute = 'erp' | 'pos'

const routeAccess: Partial<Record<UserRole, AppRoute[]>> = {
  owner: ['erp', 'pos'],
  cashier: ['pos'],
}

export function canAccessRoute(role: UserRole | null | undefined, route: AppRoute): boolean {
  if (!role) return false
  const allowedRoutes = routeAccess[role]
  if (!allowedRoutes) return false
  return allowedRoutes.includes(route)
}

export function getLandingPath(role: UserRole | null | undefined): string {
  if (!role) return '/login'
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

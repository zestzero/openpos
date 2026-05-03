import { Outlet, createRoute, redirect } from '@tanstack/react-router'

import { ErpLayout } from '@/erp/layout/ErpLayout'
import { getStoredSession } from '@/lib/auth'
import { canAccessRoute, getLandingPath } from '@/hooks/useRbac'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'erp',
  beforeLoad: () => {
    const session = getStoredSession()
    if (!session?.user?.role) {
      throw redirect({ to: '/login' } as any)
    }

    if (!canAccessRoute(session.user.role, 'erp')) {
      throw redirect({ to: getLandingPath(session.user.role) as any } as any)
    }
  },
  component: ErpRoute,
})

function ErpRoute() {
  return (
    <ErpLayout>
      <Outlet />
    </ErpLayout>
  )
}

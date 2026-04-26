import { Outlet, createRoute, redirect } from '@tanstack/react-router'

import { ErpLayout } from '@/erp/layout/ErpLayout'
import { getRedirectPath, getStoredSession } from '@/lib/auth'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'erp',
  beforeLoad: () => {
    const session = getStoredSession()
    if (!session) {
      throw redirect({ to: '/login' } as any)
    }

    if (session.user.role !== 'owner') {
      throw redirect({ to: getRedirectPath(session.user.role) } as any)
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

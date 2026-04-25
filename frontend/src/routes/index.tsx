import { createRoute, redirect } from '@tanstack/react-router'

import { getRedirectPath, getStoredSession } from '@/lib/auth'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const session = getStoredSession()
    if (!session) {
      throw redirect({ to: '/login' } as any)
    }

    throw redirect({ to: getRedirectPath(session.user.role) } as any)
  },
  component: IndexRoute,
})

function IndexRoute() {
  return null
}

import { Outlet, createRootRoute, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { getRedirectPath, getStoredSession } from '@/lib/auth'

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const session = getStoredSession()

    if (!session) {
      if (location.pathname !== '/login') {
        throw redirect({ to: '/login' } as any)
      }
      return
    }

    if (location.pathname === '/login') {
      throw redirect({ to: getRedirectPath(session.user.role) } as any)
    }
  },
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </>
  )
}

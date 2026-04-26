import { createRoute } from '@tanstack/react-router'

import { getStoredSession, hasRole } from '@/lib/auth'
import { SearchBar } from '@/pos/components/SearchBar'
import { QuickKeysBar } from '@/pos/components/QuickKeysBar'
import { CartPanel } from '@/pos/components/CartPanel'
import { PosLayout } from '@/pos/layout/PosLayout'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'pos',
  beforeLoad: () => {
    const session = getStoredSession()
    if (!session) return
    if (!hasRole(session.user.role, ['owner', 'cashier'])) return
  },
  component: PosRoute,
})

function PosRoute() {
  return (
    <PosLayout>
      <div className="flex flex-col gap-4">
        <SearchBar />
        <QuickKeysBar />
        <CartPanel />
      </div>
    </PosLayout>
  )
}

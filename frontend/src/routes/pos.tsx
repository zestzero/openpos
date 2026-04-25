import { createRoute } from '@tanstack/react-router'

import { getStoredSession, hasRole } from '@/lib/auth'
import { CheckoutPanel } from '@/pos/components/CheckoutPanel'
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
  const demoOrder = {
    store_name: 'OpenPOS Demo Store',
    paid_at: new Date().toISOString(),
    order_id: '11111111-1111-1111-1111-111111111111',
    items: [
      { name: 'Thai Tea', quantity: 1, unit_price: 4500, subtotal: 4500 },
      { name: 'Snack Pack', quantity: 2, unit_price: 2500, subtotal: 5000 },
    ],
    total_amount: 9500,
    payment_method: 'cash' as const,
    tendered_amount: 10000,
    change_due: 500,
  }

  return (
    <PosLayout>
      <CheckoutPanel order={demoOrder} />
    </PosLayout>
  )
}

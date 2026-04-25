import { createRoute } from '@tanstack/react-router'
import type { ComponentType } from 'react'
import { LayoutGrid, ScanLine, ShoppingCart } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getStoredSession, hasRole } from '@/lib/auth'
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
      <Card>
        <CardHeader>
          <CardTitle>Sell fast, stay mobile</CardTitle>
          <CardDescription>
            The cashier shell keeps catalog, scan, and cart actions reachable without deep navigation.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <MiniAction icon={LayoutGrid} title="Catalog" text="Tap-friendly categories and quick-add tiles." />
          <MiniAction icon={ScanLine} title="Scan" text="Camera and USB barcode input slot in here." />
          <MiniAction icon={ShoppingCart} title="Cart" text="Checkout totals and payment actions stay close." />
        </CardContent>
      </Card>
    </PosLayout>
  )
}

function MiniAction({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  text: string
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-2 font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  )
}

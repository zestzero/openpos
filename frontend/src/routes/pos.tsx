import { createRoute } from '@tanstack/react-router'
import type { ComponentType } from 'react'
import { LayoutGrid, ScanLine, ShoppingCart } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getStoredSession, hasRole } from '@/lib/auth'
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
    <div className="min-h-dvh bg-slate-50 px-4 py-6">
      <div className="mx-auto grid max-w-3xl gap-4">
        <Card>
          <CardHeader>
            <CardTitle>POS workspace placeholder</CardTitle>
            <CardDescription>
              The cashier shell will become a mobile-first layout in the next task.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <MiniAction icon={LayoutGrid} title="Catalog" text="Tap-friendly categories and quick-add tiles." />
            <MiniAction icon={ScanLine} title="Scan" text="Camera and USB barcode input slot in here." />
            <MiniAction icon={ShoppingCart} title="Cart" text="Checkout totals and payment actions stay close." />
          </CardContent>
        </Card>
      </div>
    </div>
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

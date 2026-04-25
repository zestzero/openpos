import { createRoute, redirect } from '@tanstack/react-router'
import { Shield } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="min-h-dvh bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-card bg-accent text-accent-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <CardTitle>Owner dashboard placeholder</CardTitle>
            <CardDescription>
              This desktop ERP surface stays separate from the cashier POS shell.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Later plans will add product, inventory, and reporting workflows here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { createRoute } from '@tanstack/react-router'
import { ArrowRight, BarChart3, Boxes, FileDown, Package, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImportDrawer } from '@/erp/import/ImportDrawer'
import { Route as erpRoute } from './erp'

// erp.index route module
export const Route = createRoute({
  getParentRoute: () => erpRoute,
  path: '/',
  component: ErpIndexRoute,
})

function ErpIndexRoute() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <Card className="border-border/70 bg-card">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground">
              <Package className="h-4 w-4" />
              Owner workspace
            </div>
            <div className="space-y-1">
              <CardTitle>ERP cockpit ready for products, inventory, and reports</CardTitle>
              <CardDescription>
                The desktop shell is live — use the left navigation for management areas and the tabs for fast switching.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create product
            </Button>
            <ImportDrawer />
            <Button variant="ghost" className="gap-2">
              <FileDown className="h-4 w-4" />
              Export report
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-secondary/40">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BarChart3 className="h-4 w-4 text-brand" />
              Reporting preview
            </div>
            <CardTitle className="text-lg">Monthly performance, stock, and gross profit</CardTitle>
            <CardDescription>
              Reporting workflows will plug into this shell without changing the desktop frame.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Metric label="Revenue" value="฿0.00" />
            <Metric label="Low stock" value="0 items" />
            <Metric label="Orders" value="0" />
            <Metric label="Gross profit" value="฿0.00" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Boxes className="h-4 w-4 text-brand" />
              Product registry
            </div>
            <CardTitle className="text-lg">No products yet</CardTitle>
            <CardDescription>
              Create your first product or import a CSV to start managing variants, stock, and reports.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Boxes className="h-4 w-4 text-brand" />
              Inventory health
            </div>
            <CardTitle className="text-lg">Ledger-driven by design</CardTitle>
            <CardDescription>
              Future adjustments will stay audit-friendly with inventory transactions instead of raw quantity edits.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowRight className="h-4 w-4 text-brand" />
              Next actions
            </div>
            <CardTitle className="text-lg">Ready for CRUD and reporting flows</CardTitle>
            <CardDescription>
              The shell is in place for the remaining ERP workstreams without blocking POS navigation.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border bg-background px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

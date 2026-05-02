import type { LucideIcon } from 'lucide-react'
import { BarChart3, Boxes, LayoutDashboard, Settings2, ShoppingCart, Table2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

type NavItem = {
  label: string
  icon: LucideIcon
  active?: boolean
}

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, active: true },
      { label: 'Products', icon: Boxes },
      { label: 'Inventory', icon: Table2 },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Sales handoff', icon: ShoppingCart },
      { label: 'Reports', icon: BarChart3 },
      { label: 'Settings', icon: Settings2 },
    ],
  },
]

export function ErpNav() {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-secondary/40 px-4 py-5">
      <div className="flex items-center gap-3 px-2 pb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-card bg-brand/15 text-brand">
          <span className="text-sm font-semibold tracking-wide">O</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">OpenPOS ERP</p>
          <p className="text-xs text-muted-foreground">Owner access only</p>
        </div>
      </div>

      <div className="space-y-5">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="px-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon

                return (
                  <Button
                    key={item.label}
                    type="button"
                    variant={item.active ? 'secondary' : 'ghost'}
                    className="h-10 w-full justify-start gap-3 rounded-card px-3"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <div className="rounded-card border border-border bg-background px-4 py-3">
          <p className="text-sm font-medium text-foreground">ERP shell</p>
          <p className="mt-1 text-sm text-muted-foreground">Left nav, utility bar, and tabs stay fixed as workflows expand.</p>
        </div>
      </div>
    </aside>
  )
}

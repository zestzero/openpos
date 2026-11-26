import { type ComponentType } from 'react'
import { ShoppingCart, Warehouse } from 'lucide-react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

export type PosTab = 'sales' | 'inventory'

const navItems: Array<{ tab: PosTab; label: string; icon: ComponentType<{ className?: string }>; to: string }> = [
  { tab: 'sales', label: 'Selling', icon: ShoppingCart, to: '/pos' },
  { tab: 'inventory', label: 'Inventory', icon: Warehouse, to: '/pos/inventory' },
]

export function PosNav() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto flex max-w-lg items-center gap-1 rounded-full border border-border bg-card p-1.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.to
          return (
            <button
              key={item.tab}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => navigate({ to: item.to })}
              className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-foreground text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

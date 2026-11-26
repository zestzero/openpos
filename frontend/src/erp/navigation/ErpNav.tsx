import type { LucideIcon } from 'lucide-react'
import { BarChart3, Boxes, FolderTree, LayoutDashboard, Settings2, ShoppingCart, Table2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  icon: LucideIcon
  to: string | null
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/erp' },
  { label: 'Products', icon: Boxes, to: '/erp/products' },
  { label: 'Categories', icon: FolderTree, to: '/erp/categories' },
  { label: 'Inventory', icon: Table2, to: '/erp/inventory' },
  { label: 'Sales handoff', icon: ShoppingCart, to: null },
  { label: 'Reports', icon: BarChart3, to: '/erp/reports' },
  { label: 'Settings', icon: Settings2, to: '/erp/settings' },
]

export function ErpNav() {
  const pathname = typeof window !== 'undefined' && window.location.pathname !== '/' ? window.location.pathname : '/erp'

  return (
    <aside className="flex shrink-0 flex-row items-center gap-2 overflow-x-auto border-b border-border bg-card px-3 py-3 md:w-[6.75rem] md:flex-col md:items-stretch md:overflow-visible md:border-b-0 md:border-r md:px-2 md:py-5">
      <div className="flex shrink-0 items-center gap-2 px-1 md:flex-col md:pb-5">
        <div className="flex size-11 items-center justify-center rounded-full bg-foreground text-sm font-bold text-accent">
          O
        </div>
      </div>

      <nav className="flex flex-1 flex-row gap-1 md:flex-col md:gap-1.5" aria-label="ERP">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.to === '/erp' ? pathname === '/erp' : Boolean(item.to && (pathname === item.to || pathname.startsWith(`${item.to}/`)))
          const className = cn(
            'flex h-auto min-h-14 min-w-14 flex-col items-center justify-center gap-1 whitespace-normal rounded-2xl px-2 py-2 text-xs font-semibold leading-tight',
            isActive ? 'bg-foreground text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )

          return item.to ? (
            <a key={item.label} href={item.to} className={className}>
              <Icon className="size-5" aria-hidden="true" />
              <span className="max-w-[4.5rem] text-center">{item.label}</span>
            </a>
          ) : (
            <Button key={item.label} type="button" variant="ghost" className={cn(className, 'h-auto')}>
              <Icon className="size-5" aria-hidden="true" />
              <span className="max-w-[4.5rem] text-center">{item.label}</span>
            </Button>
          )
        })}
      </nav>

      <p className="max-w-16 px-1 text-center text-[11px] leading-snug text-muted-foreground md:mt-auto md:max-w-none md:pt-4">
        Owner access only
      </p>
    </aside>
  )
}

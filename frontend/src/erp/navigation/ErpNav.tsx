import { Link, useRouterState } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { BarChart3, Boxes, FolderTree, LayoutDashboard, Settings2, ShoppingCart, Table2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n, type TranslationKey } from '@/lib/i18n'

type NavItem = {
  key: TranslationKey
  icon: LucideIcon
  to: string | null
}

const navItems: NavItem[] = [
  { key: 'erp.dashboard', icon: LayoutDashboard, to: '/erp' },
  { key: 'erp.products', icon: Boxes, to: '/erp/products' },
  { key: 'erp.categories', icon: FolderTree, to: '/erp/categories' },
  { key: 'erp.inventory', icon: Table2, to: '/erp/inventory' },
  { key: 'erp.salesHandoff', icon: ShoppingCart, to: null },
  { key: 'erp.reports', icon: BarChart3, to: '/erp/reports' },
  { key: 'erp.settings', icon: Settings2, to: '/erp/settings' },
]

export function ErpNav() {
  const { t } = useI18n()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <aside className="flex shrink-0 flex-row items-center gap-2 overflow-x-auto border-b border-border bg-card px-3 py-3 md:w-[6.75rem] md:flex-col md:items-stretch md:overflow-visible md:border-b-0 md:border-r md:px-2 md:py-5">
      <div className="flex shrink-0 items-center gap-2 px-1 md:flex-col md:pb-5">
        <div className="flex size-11 items-center justify-center rounded-full bg-foreground text-sm font-bold text-accent">
          O
        </div>
      </div>

      <nav className="flex flex-1 flex-row gap-1 md:flex-col md:gap-1.5" aria-label={t('erp.label')}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.to === '/erp' ? pathname === '/erp' : Boolean(item.to && (pathname === item.to || pathname.startsWith(`${item.to}/`)))
          const className = cn(
            'flex h-auto min-h-14 min-w-14 flex-col items-center justify-center gap-1 whitespace-normal rounded-2xl px-2 py-2 text-xs font-semibold leading-tight',
            isActive ? 'bg-foreground text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )

          return item.to ? (
            <Link key={item.key} to={item.to} className={className}>
              <Icon className="size-5" aria-hidden="true" />
              <span className="max-w-[4.5rem] text-center">{t(item.key)}</span>
            </Link>
          ) : (
            <Button key={item.key} type="button" variant="ghost" className={cn(className, 'h-auto')}>
              <Icon className="size-5" aria-hidden="true" />
              <span className="max-w-[4.5rem] text-center">{t(item.key)}</span>
            </Button>
          )
        })}
      </nav>

      <p className="max-w-16 px-1 text-center text-[11px] leading-snug text-muted-foreground md:mt-auto md:max-w-none md:pt-4">
        {t('erp.ownerAccess')}
      </p>
    </aside>
  )
}

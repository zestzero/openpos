import type { ComponentType } from 'react'
import { Barcode, LayoutGrid, ShoppingCart } from 'lucide-react'
import { useNavigate, useLocation } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

export type PosTab = 'catalog' | 'scan' | 'cart'

interface PosNavProps {
  activeTab?: PosTab
  onChangeTab?: (tab: PosTab) => void
}

const navItems: Array<{ tab: PosTab; label: string; icon: ComponentType<{ className?: string }>; path: string }> = [
  { tab: 'catalog', label: 'Catalog', icon: LayoutGrid, path: '/pos/catalog' },
  { tab: 'scan', label: 'Scan', icon: Barcode, path: '/pos/scan' },
  { tab: 'cart', label: 'Cart', icon: ShoppingCart, path: '/pos' },
]

export function PosNav({ activeTab, onChangeTab }: PosNavProps) {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine active tab based on current path
  const currentPath = location.pathname
  const currentTab = activeTab || navItems.find(item => 
    item.path === currentPath || 
    (currentPath === '/pos' && item.tab === 'cart') ||
    (currentPath === '/pos/catalog' && item.tab === 'catalog')
  )?.tab || 'cart'

  const handleNavClick = (tab: PosTab, path: string) => {
    // If there's an onChangeTab callback, use that (for internal state mode)
    if (onChangeTab) {
      onChangeTab(tab)
    }
    // Always navigate to the route
    navigate({ to: path })
  }

  return (
    <nav className="safe-area-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-3 pt-3 backdrop-blur-sm">
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <Button
              key={item.tab}
              type="button"
              variant={currentTab === item.tab ? 'default' : 'ghost'}
              className="h-14 min-h-11 min-w-11 flex-col rounded-pill"
              onClick={() => handleNavClick(item.tab, item.path)}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}

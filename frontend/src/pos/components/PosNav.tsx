import type { ComponentType } from 'react'
import { Barcode, LayoutGrid, ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'

export type PosTab = 'catalog' | 'scan' | 'cart'

interface PosNavProps {
  activeTab: PosTab
  onChangeTab: (tab: PosTab) => void
}

const navItems: Array<{ tab: PosTab; label: string; icon: ComponentType<{ className?: string }> }> = [
  { tab: 'catalog', label: 'Catalog', icon: LayoutGrid },
  { tab: 'scan', label: 'Scan', icon: Barcode },
  { tab: 'cart', label: 'Cart', icon: ShoppingCart },
]

export function PosNav({ activeTab, onChangeTab }: PosNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <Button
              key={item.tab}
              type="button"
              variant={activeTab === item.tab ? 'default' : 'ghost'}
              className="h-14 min-h-11 min-w-11 flex-col rounded-2xl"
              onClick={() => onChangeTab(item.tab)}
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

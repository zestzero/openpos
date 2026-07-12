import { Minus, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatCurrency'
import type { CartItem } from '@/pos/hooks/useCart'
import { posCopy } from '@/pos/lib/copy'

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (variantId: string, quantity: number) => void
  onRemove: (variantId: string) => void
  compact?: boolean
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{item.productName}</p>
          {item.variantName !== 'Default' ? <p className="truncate text-base text-muted-foreground">{item.variantName}</p> : null}
        </div>
        <p className="shrink-0 text-lg font-bold tabular-nums">{formatCurrency(item.subtotal)}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" className="size-12 rounded-xl" onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)} aria-label={`${posCopy.decrease}: ${item.productName}`}>
            <Minus aria-hidden="true" />
          </Button>
          <span className="min-w-10 text-center text-xl font-bold tabular-nums">{item.quantity}</span>
          <Button size="icon" variant="outline" className="size-12 rounded-xl" onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)} aria-label={`${posCopy.increase}: ${item.productName}`}>
            <Plus aria-hidden="true" />
          </Button>
        </div>
        <Button variant="ghost" className="min-h-12 text-base text-destructive" onClick={() => onRemove(item.variantId)}>
          <Trash2 data-icon="inline-start" />{posCopy.remove}
        </Button>
      </div>
    </div>
  )
}

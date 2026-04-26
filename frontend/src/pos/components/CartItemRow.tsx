'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatCurrency'
import type { CartItem } from '@/pos/hooks/useCart'

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (variantId: string, quantity: number) => void
  onRemove: (variantId: string) => void
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) {
  return (
    <div className="flex items-center gap-3 border-b py-3 last:border-b-0">
      <div className="flex-1 truncate">
        <div className="font-medium">{item.productName}</div>
        <div className="text-sm text-muted-foreground">{item.variantName}</div>
        <div className="text-sm text-muted-foreground">
          {formatCurrency(item.price)} each
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          className="h-11 w-11"
          onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-[2rem] text-center font-medium">
          {item.quantity}
        </span>
        <Button
          size="icon"
          variant="outline"
          className="h-11 w-11"
          onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="font-semibold text-primary">
          {formatCurrency(item.subtotal)}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive"
          onClick={() => onRemove(item.variantId)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
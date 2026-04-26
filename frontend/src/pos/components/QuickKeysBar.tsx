'use client'

import { useFavorites, type FavoriteItem } from '@/pos/hooks/useFavorites'
import { useCart } from '@/pos/hooks/useCart'
import { formatCurrency } from '@/lib/formatCurrency'
import { Button } from '@/components/ui/button'

export function QuickKeysBar() {
  const { favorites, recordAdd } = useFavorites()
  const { addItem } = useCart()

  if (favorites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
        Pin a repeat seller from search or the catalog to build one-tap quick keys.
      </div>
    )
  }

  const handleQuickAdd = (item: FavoriteItem) => {
    addItem({
      id: item.variantId,
      product_id: '', // Not needed for cart add
      sku: '',
      name: item.variantName,
      price: item.price,
      is_active: true,
      productName: item.productName,
    })
    recordAdd({
      id: item.variantId,
      product_id: '', // Not needed for tracking
      sku: '',
      name: item.variantName,
      price: item.price,
      is_active: true,
      productName: item.productName,
    })
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {favorites.map((item) => (
        <Button
          key={item.variantId}
          variant="outline"
          className="min-h-[4.75rem] min-w-[10rem] shrink-0 flex-col items-start justify-between gap-1 rounded-2xl px-3 py-3 text-left"
          onClick={() => handleQuickAdd(item)}
        >
          <span className="line-clamp-2 text-sm font-medium leading-5">{item.variantName}</span>
          <span className="text-xs font-semibold text-primary">
            {formatCurrency(item.price)}
          </span>
        </Button>
      ))}
    </div>
  )
}

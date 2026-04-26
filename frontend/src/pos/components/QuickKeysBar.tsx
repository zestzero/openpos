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
      <div className="flex h-[72px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        Add items to see quick keys
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
    <div className="flex h-[72px] gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {favorites.map((item) => (
        <Button
          key={item.variantId}
          variant="outline"
          className="h-full min-w-[100px] shrink-0 flex-col gap-1 px-3 py-2"
          onClick={() => handleQuickAdd(item)}
        >
          <span className="truncate text-sm font-medium">{item.variantName}</span>
          <span className="text-xs font-semibold text-primary">
            {formatCurrency(item.price)}
          </span>
        </Button>
      ))}
    </div>
  )
}
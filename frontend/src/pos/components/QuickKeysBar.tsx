import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatCurrency'
import { useCart } from '@/pos/hooks/useCart'
import { useFavorites, type FavoriteItem } from '@/pos/hooks/useFavorites'

interface QuickKeysBarProps {
  onAdded?: (variantId: string, productName: string) => void
}

export function QuickKeysBar({ onAdded }: QuickKeysBarProps) {
  const { favorites, recordAdd } = useFavorites()
  const { addItem } = useCart()
  if (favorites.length === 0) return null

  const handleQuickAdd = (item: FavoriteItem) => {
    const variant = {
      id: item.variantId,
      product_id: '',
      sku: '',
      name: item.variantName,
      price: item.price,
      is_active: true,
      productName: item.productName,
    }
    addItem(variant)
    recordAdd(variant)
    onAdded?.(item.variantId, item.productName)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {favorites.slice(0, 4).map((item) => (
        <Button
          key={item.variantId}
          variant="outline"
          className="min-h-16 flex-col items-start justify-center gap-1 rounded-xl px-3 text-left"
          onClick={() => handleQuickAdd(item)}
        >
          <span className="w-full truncate text-base font-semibold">{item.productName}</span>
          <span className="text-base font-bold tabular-nums text-primary">{formatCurrency(item.price)}</span>
        </Button>
      ))}
    </div>
  )
}

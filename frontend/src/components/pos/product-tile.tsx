import { Card } from '@/components/ui/card'
import { formatTHB } from '@/lib/format'
import type { LowStockVariant, ProductResponse, VariantResponse } from '@/lib/api-client'
import { LowStockBadge } from './low-stock-badge'

interface ProductTileProps {
  product: ProductResponse
  variants: VariantResponse[]
  onAddToCart: (variant: VariantResponse) => void
  lowStockInfo?: Record<string, LowStockVariant>
}

export function ProductTile({ product, variants, onAddToCart, lowStockInfo }: ProductTileProps) {
  const activeVariants = variants.filter(v => v.active)
  const primaryVariant = activeVariants[0]

  if (!primaryVariant) return null

  const hasLowStockVariant = Object.values(lowStockInfo || {}).some(
    (lsv) => lsv.product_id === product.id
  )
  const primaryLowStock = primaryVariant ? lowStockInfo?.[primaryVariant.id] : undefined

  return (
    <Card
      className="p-3 cursor-pointer active:scale-[0.97] transition-transform touch-manipulation relative"
      onClick={() => {
        if (activeVariants.length === 1) {
          onAddToCart(primaryVariant)
        }
      }}
    >
      {primaryLowStock && <LowStockBadge {...primaryLowStock} />}
      <div className="aspect-square bg-surface rounded-md mb-2 flex items-center justify-center">
        <span className="text-2xl text-zinc-300">📦</span>
      </div>
      <p className="text-sm font-semibold truncate">{product.name}</p>
      <p className="text-sm text-zinc-500 mt-0.5">
        {activeVariants.length > 1
          ? `from ${formatTHB(Math.min(...activeVariants.map(v => v.price_cents)))}`
          : formatTHB(primaryVariant.price_cents)
        }
      </p>
    </Card>
  )
}

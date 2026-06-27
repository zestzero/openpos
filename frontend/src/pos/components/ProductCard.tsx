'use client'

import { Plus } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatCurrency'
import { type ProductWithVariants } from '@/lib/api'
import { useCart } from '@/pos/hooks/useCart'
import { useFavorites } from '@/pos/hooks/useFavorites'

interface ProductCardProps {
  product: ProductWithVariants
  onAdd?: (cartItem: any) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const { addItem } = useCart()
  const { recordAdd } = useFavorites()
  const { product: p, variants } = product
  const primaryVariant = variants[0]
  const categoryLabel = product.category?.name ?? 'General'
  const skuLabel = primaryVariant?.sku ?? p.name.slice(0, 3).toUpperCase()

  const handleAdd = () => {
    if (!primaryVariant) return

    const cartItem = {
      ...primaryVariant,
      productName: p.name,
    }

    if (onAdd) {
      onAdd(cartItem)
      return
    }

    addItem(cartItem)
    recordAdd(cartItem)
  }

  return (
    <Card className="group overflow-hidden rounded-3xl border-none bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      <CardContent className="p-0">
        <div
          role="button"
          tabIndex={0}
          className="block w-full text-left outline-none"
          onClick={handleAdd}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleAdd()
            }
          }}
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
            {p.image_url ? (
              <img
                alt={p.name}
                src={p.image_url}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-orange-50 p-4">
                <div className="text-center">
                  <div className="text-4xl">🍽️</div>
                </div>
              </div>
            )}

            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 shadow-sm backdrop-blur-md">
              {categoryLabel}
            </div>

            <button
              type="button"
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              onClick={(event) => {
                event.stopPropagation()
                handleAdd()
              }}
              aria-label={`Add ${p.name}`}
            >
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <p className="line-clamp-2 text-sm font-bold leading-tight text-gray-900">{p.name}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-gray-500">SKU: {skuLabel}</p>
            <p className="shrink-0 text-sm font-bold text-brand">{formatCurrency(primaryVariant?.price ?? 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { Plus } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatCurrency'
import { type ProductWithVariants } from '@/lib/api'
import { useCart } from '@/pos/hooks/useCart'
import { useFavorites } from '@/pos/hooks/useFavorites'

interface ProductCardProps {
  product: ProductWithVariants
}

export function ProductCard({ product }: ProductCardProps) {
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

    addItem(cartItem)
    recordAdd(cartItem)
  }

  return (
    <Card className="group overflow-hidden rounded-card border-border/80 bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
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
          <div className="relative aspect-square overflow-hidden bg-muted/40">
            {p.image_url ? (
              <img
                alt={p.name}
                src={p.image_url}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-end bg-[linear-gradient(135deg,rgba(24,226,153,0.12),rgba(255,255,255,0.9))] p-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{categoryLabel}</div>
                  <div className="mt-1 text-lg font-semibold leading-tight text-foreground">{p.name}</div>
                </div>
              </div>
            )}

            <div className="absolute left-2 top-2 rounded-full border border-border/70 bg-card/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-card backdrop-blur-sm">
              {categoryLabel}
            </div>

            <button
              type="button"
              className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card transition-transform hover:bg-primary/90 active:scale-90"
              onClick={(event) => {
                event.stopPropagation()
                handleAdd()
              }}
              aria-label={`Add ${p.name}`}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5 p-3">
          <p className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground">{p.name}</p>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <p className="truncate font-mono tracking-[0.02em]">SKU: {skuLabel}</p>
            <p className="shrink-0 font-semibold text-foreground">{formatCurrency(primaryVariant?.price ?? 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

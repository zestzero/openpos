import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/formatCurrency'
import type { ProductWithVariants, Variant } from '@/lib/api'
import { useCart } from '@/pos/hooks/useCart'
import { useFavorites } from '@/pos/hooks/useFavorites'
import { posCopy } from '@/pos/lib/copy'

interface ProductCardProps {
  product: ProductWithVariants
  onAdded?: (variantId: string, productName: string) => void
}

export function ProductCard({ product, onAdded }: ProductCardProps) {
  const [chooserOpen, setChooserOpen] = useState(false)
  const { addItem } = useCart()
  const { recordAdd } = useFavorites()
  const activeVariants = product.variants.filter((variant) => variant.is_active)

  const addVariant = (variant: Variant) => {
    const item = { ...variant, productName: product.product.name }
    addItem(item)
    recordAdd(item)
    onAdded?.(variant.id, product.product.name)
    setChooserOpen(false)
  }

  const handleProductClick = () => {
    if (activeVariants.length === 1) addVariant(activeVariants[0])
    else if (activeVariants.length > 1) setChooserOpen(true)
  }

  if (activeVariants.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={handleProductClick}
        className="flex min-h-36 w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left outline-none transition-colors active:bg-accent focus-visible:ring-3 focus-visible:ring-ring/40"
        aria-label={`${product.product.name}, ${formatCurrency(activeVariants[0].price)}`}
      >
        {product.product.image_url ? (
          <img alt="" src={product.product.image_url} className="aspect-[5/3] w-full object-cover" />
        ) : (
          <div className="flex aspect-[5/3] w-full items-center justify-center bg-surface-low text-3xl" aria-hidden="true">🍽️</div>
        )}
        <span className="flex w-full flex-1 flex-col justify-between gap-2 p-3">
          <span className="line-clamp-2 text-lg font-bold leading-6 text-foreground">{product.product.name}</span>
          <span className="text-lg font-bold tabular-nums text-primary">{formatCurrency(activeVariants[0].price)}</span>
        </span>
      </button>

      <Dialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <DialogContent className="inset-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-6 rounded-none border-0 p-5 sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90dvh] sm:w-[min(100%-2rem,32rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border">
          <DialogHeader className="pr-10 text-left">
            <DialogTitle className="text-2xl">{product.product.name}</DialogTitle>
            <DialogDescription className="text-base">{posCopy.chooseOption}</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            {activeVariants.map((variant) => (
              <Button
                key={variant.id}
                variant="outline"
                className="min-h-16 justify-between rounded-xl px-4 text-lg"
                onClick={() => addVariant(variant)}
              >
                <span className="truncate">{variant.name}</span>
                <span className="shrink-0 font-bold tabular-nums">{formatCurrency(variant.price)}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatCurrency'
import { api, type ProductWithVariants } from '@/lib/api'
import { useCart } from '@/pos/hooks/useCart'
import { useFavorites } from '@/pos/hooks/useFavorites'

interface ProductCardProps {
  product: ProductWithVariants
}

export function ProductCard({ product }: ProductCardProps) {
  const [showVariants, setShowVariants] = useState(false)
  const { addItem } = useCart()
  const { recordAdd } = useFavorites()
  const { product: p, variants } = product

  // If product has only one variant, allow direct add
  if (variants.length === 1) {
    const variant = variants[0]
    return (
      <Card className="min-h-[80px] cursor-pointer transition-colors hover:bg-muted/50">
        <CardContent className="flex flex-col justify-between p-3">
          <div className="mb-2 line-clamp-2 text-sm font-medium">
            {p.name}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-primary">
              {formatCurrency(variant.price)}
            </span>
            <Button
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                addItem({
                  ...variant,
                  productName: p.name,
                })
                recordAdd({
                  ...variant,
                  productName: p.name,
                })
              }}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Multiple variants - show variant selector
  return (
    <Card
      className="min-h-[80px] cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => setShowVariants(!showVariants)}
    >
      <CardContent className="flex flex-col justify-between p-3">
        <div className="mb-2 line-clamp-2 text-sm font-medium">
          {p.name}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-primary">
            {formatCurrency(variants[0]?.price ?? 0)}
          </span>
          <Button
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              setShowVariants(!showVariants)
            }}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {showVariants && (
          <div className="mt-3 grid gap-2 border-t pt-3">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="flex items-center justify-between rounded bg-muted p-2"
              >
                <div className="flex-1 truncate text-sm">
                  <span className="font-medium">{variant.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    {formatCurrency(variant.price)}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="h-9 min-w-[60px]"
                  onClick={(e) => {
                    e.stopPropagation()
                    addItem({
                      ...variant,
                      productName: p.name,
                    })
                    recordAdd({
                      ...variant,
                      productName: p.name,
                    })
                    setShowVariants(false)
                  }}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
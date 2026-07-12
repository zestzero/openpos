'use client'

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { api, type ProductWithVariants } from '@/lib/api'
import { ProductCard } from './ProductCard'
import { posCopy } from '@/pos/lib/copy'

interface CatalogGridProps {
  categoryId: string | null
  onProductAdded?: (variantId: string, productName: string) => void
}

export function CatalogGrid({ categoryId, onProductAdded }: CatalogGridProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      const result = await api.getProducts(categoryId ?? undefined)
      return result.data
    },
    staleTime: 30 * 1000, // 30 seconds
  })

  const products: ProductWithVariants[] = data ?? []

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="min-h-36 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 border-y border-border px-6 py-10 text-center">
        <p className="text-lg font-bold text-foreground">{posCopy.productLoadError}</p>
        <Button variant="outline" onClick={() => refetch()}>
          {posCopy.retry}
        </Button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 border-y border-border px-6 py-10 text-center text-muted-foreground">
        <p className="text-lg font-bold text-foreground">{posCopy.noProducts}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {products.map((item) => (
        <ProductCard key={item.product.id} product={item} onAdded={onProductAdded} />
      ))}
    </div>
  )
}

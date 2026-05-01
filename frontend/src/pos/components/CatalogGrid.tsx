'use client'

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { api, type ProductWithVariants } from '@/lib/api'
import { ProductCard } from './ProductCard'

interface CatalogGridProps {
  categoryId: string | null
}

export function CatalogGrid({ categoryId }: CatalogGridProps) {
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[17rem] animate-pulse rounded-card border border-border bg-card shadow-card"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-card border border-border bg-card px-6 py-10 text-center shadow-card">
        <p className="text-sm font-medium text-foreground">Failed to load products</p>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">Try again. If the network is unstable, the catalog will recover automatically once the connection returns.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-card px-6 py-10 text-center text-muted-foreground shadow-card">
        <p className="font-medium text-foreground">No products in this category</p>
        <p className="max-w-sm text-sm leading-6">Pick a different category, or clear the filter to bring the full shelf back into view.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((item) => (
        <ProductCard key={item.product.id} product={item} />
      ))}
    </div>
  )
}

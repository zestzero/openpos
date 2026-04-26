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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[80px] animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <p className="text-destructive">Failed to load products</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
        <p>No products in this category</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((item) => (
        <ProductCard key={item.product.id} product={item} />
      ))}
    </div>
  )
}
  variants: Variant[]
}

interface CatalogGridProps {
  categoryId: string | null
}

export function CatalogGrid({ categoryId }: CatalogGridProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      // Use the products endpoint with optional category filter
      const result = await api.getProducts()
      let products: Product[] = result.data

      // Filter by category if selected
      if (categoryId) {
        products = products.filter(
          (p) => p.category_id === categoryId && p.is_active
        )
      } else {
        products = products.filter((p) => p.is_active)
      }

      return products
    },
    staleTime: 30 * 1000, // 30 seconds
  })

  const products: Product[] = data ?? []

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[80px] animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <p className="text-destructive">Failed to load products</p>
        <Button
          variant="outline"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
        <p>No products in this category</p>
      </div>
    )
  }

  // For now, we'll create a simple ProductWithVariants structure
  // In a real app, you'd fetch variants per product or have a batch endpoint
  const productsWithVariants: ProductWithVariants[] = products.map((p) => ({
    product: p,
    variants: [], // Will be populated or this is a placeholder
  }))

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={{
            product: p,
            variants: [],
          }}
        />
      ))}
    </div>
  )
}
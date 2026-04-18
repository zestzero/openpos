import { ProductTile } from './product-tile'
import type { LowStockVariant, ProductResponse, VariantResponse } from '@/lib/api-client'

interface ProductGridProps {
  products: ProductResponse[]
  variantsByProduct: Record<string, VariantResponse[]>
  onAddToCart: (variant: VariantResponse) => void
  isLoading?: boolean
  lowStockInfo?: Record<string, LowStockVariant>
}

export function ProductGrid({ products, variantsByProduct, onAddToCart, isLoading, lowStockInfo }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-surface rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <p className="text-lg font-medium">No products found</p>
        <p className="text-sm mt-1">Try a different category or search term</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
      {products.map((product) => (
        <ProductTile
          key={product.id}
          product={product}
          variants={variantsByProduct[product.id] || []}
          onAddToCart={onAddToCart}
          lowStockInfo={lowStockInfo}
        />
      ))}
    </div>
  )
}

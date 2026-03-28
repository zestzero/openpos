import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useCategories, useProducts, useSearchProducts } from '@/hooks/use-catalog'
import { fetchVariants, type VariantResponse } from '@/lib/api-client'
import { SearchBar } from '@/components/pos/search-bar'
import { CategoryTabs } from '@/components/pos/category-tabs'
import { ProductGrid } from '@/components/pos/product-grid'

export const Route = createFileRoute('/pos/')({
  component: POSScreen,
})

function POSScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: categories = [] } = useCategories()
  const { data: browseProducts = [], isLoading: isBrowseLoading } = useProducts(
    selectedCategory ?? undefined
  )
  const { data: searchResults = [], isLoading: isSearchLoading } = useSearchProducts(searchQuery)

  const isSearching = searchQuery.length >= 2
  const displayProducts = isSearching ? searchResults : browseProducts
  const isLoading = isSearching ? isSearchLoading : isBrowseLoading

  const { data: variantsByProduct = {} } = useQuery({
    queryKey: ['variants-batch', displayProducts.map(p => p.id)],
    queryFn: async () => {
      const entries = await Promise.all(
        displayProducts.map(async (p) => {
          const { variants } = await fetchVariants(p.id)
          return [p.id, variants] as const
        })
      )
      return Object.fromEntries(entries) as Record<string, VariantResponse[]>
    },
    enabled: displayProducts.length > 0,
  })

  const handleAddToCart = (variant: VariantResponse) => {
    console.log('Add to cart:', variant.sku, variant.price_cents)
  }

  return (
    <div className="flex flex-col h-dvh">
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onScanPress={() => {}}
      />
      {!isSearching && (
        <CategoryTabs
          categories={categories}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />
      )}
      <div className="flex-1 overflow-y-auto pb-20">
        <ProductGrid
          products={displayProducts}
          variantsByProduct={variantsByProduct}
          onAddToCart={handleAddToCart}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}

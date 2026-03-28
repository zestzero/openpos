import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCategories, useProducts, useSearchProducts } from '@/hooks/use-catalog'
import { fetchProducts, fetchVariants, type VariantResponse } from '@/lib/api-client'
import { SearchBar } from '@/components/pos/search-bar'
import { CategoryTabs } from '@/components/pos/category-tabs'
import { FavoritesBar } from '@/components/pos/favorites-bar'
import { ProductGrid } from '@/components/pos/product-grid'
import { CartSummaryBar } from '@/components/pos/cart-summary-bar'
import { CartBottomSheet } from '@/components/pos/cart-bottom-sheet'
import { BarcodeScanner } from '@/components/pos/barcode-scanner'
import { useKeyboardWedge } from '@/hooks/use-keyboard-wedge'
import { useCartStore } from '@/stores/cart-store'

export const Route = createFileRoute('/pos/')({
  component: POSScreen,
})

function POSScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

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

  const addItem = useCartStore((s) => s.addItem)
  const setSheetOpen = useCartStore((s) => s.setSheetOpen)
  const getItemCount = useCartStore((s) => s.getItemCount)
  const getTotalCents = useCartStore((s) => s.getTotalCents)

  const variantToProductName: Record<string, string> = {}
  for (const product of displayProducts) {
    const variants = variantsByProduct[product.id] || []
    for (const variant of variants) {
      variantToProductName[variant.id] = product.name
    }
  }

  const handleAddToCart = (variant: VariantResponse) => {
    const productName = variantToProductName[variant.id] || 'Unknown Product'
    addItem({
      variant_id: variant.id,
      product_id: variant.product_id,
      product_name: productName,
      variant_sku: variant.sku,
      barcode: variant.barcode,
      price_cents: variant.price_cents,
      cost_cents: variant.cost_cents,
    })
  }

  const itemCount = getItemCount()
  const totalCents = getTotalCents()

  const handleBarcodeScan = async (barcode: string) => {
    const { products } = await fetchProducts({ search: barcode })
    if (products.length === 0) {
      toast.error('Barcode not found')
      return
    }
    const product = products[0]
    const { variants } = await fetchVariants(product.id)
    const activeVariant = variants.find((v: VariantResponse) => v.active && v.barcode === barcode) || variants.find((v: VariantResponse) => v.active)
    if (!activeVariant) {
      toast.error('Barcode not found')
      return
    }
    addItem({
      variant_id: activeVariant.id,
      product_id: activeVariant.product_id,
      product_name: product.name,
      variant_sku: activeVariant.sku,
      barcode: activeVariant.barcode,
      price_cents: activeVariant.price_cents,
      cost_cents: activeVariant.cost_cents,
    })
    setSheetOpen(true)
  }

  useKeyboardWedge(handleBarcodeScan)

  return (
    <div className="flex flex-col h-dvh">
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onScanPress={() => setScannerOpen(true)}
      />
      {!isSearching && (
        <CategoryTabs
          categories={categories}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />
      )}
      <FavoritesBar />
      <div className="flex-1 overflow-y-auto pb-20">
        <ProductGrid
          products={displayProducts}
          variantsByProduct={variantsByProduct}
          onAddToCart={handleAddToCart}
          isLoading={isLoading}
        />
      </div>
      <CartSummaryBar
        itemCount={itemCount}
        totalCents={totalCents}
        onClick={() => setSheetOpen(true)}
      />
      <CartBottomSheet />
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={handleBarcodeScan}
      />
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api, type Variant } from '@/lib/api'
import { formatCurrency } from '@/lib/formatCurrency'
import { useCart } from '@/pos/hooks/useCart'
import { useFavorites } from '@/pos/hooks/useFavorites'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<(Variant & { product_name: string })[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const { addItem } = useCart()
  const { recordAdd } = useFavorites()

  const searchMutation = useMutation({
    mutationFn: async (q: string) => {
      const result = await api.searchVariant(q)
      return result.data
    },
    onSuccess: (data) => {
      setResults(data)
      setHasSearched(true)
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      searchMutation.mutate(query.trim())
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setHasSearched(false)
  }

  const handleAddResult = (variant: Variant & { product_name: string }) => {
    addItem({
      id: variant.id,
      product_id: variant.product_id,
      sku: variant.sku,
      barcode: variant.barcode ?? undefined,
      name: variant.name,
      price: variant.price,
      cost: variant.cost ?? undefined,
      is_active: variant.is_active,
      productName: variant.product_name,
    })
    recordAdd({
      id: variant.id,
      product_id: variant.product_id,
      sku: variant.sku,
      barcode: variant.barcode ?? undefined,
      name: variant.name,
      price: variant.price,
      cost: variant.cost ?? undefined,
      is_active: variant.is_active,
      productName: variant.product_name,
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 text-base"
          />
        </div>
        <Button type="submit" size="icon" variant="secondary">
          <Search className="h-4 w-4" />
        </Button>
        {query && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {searchMutation.isPending && (
        <div className="py-2 text-center text-muted-foreground">
          Searching...
        </div>
      )}

      {hasSearched && results.length === 0 && (
        <div className="py-2 text-center text-muted-foreground">
          No products found for "{query}"
        </div>
      )}

      {results.length > 0 && (
        <div className="max-h-64 overflow-y-auto rounded-md border bg-background">
          {results.map((variant) => (
            <button
              key={variant.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted"
              onClick={() => handleAddResult(variant)}
            >
              <div className="flex-1 truncate">
                <div className="font-medium">{variant.product_name}</div>
                <div className="text-sm text-muted-foreground">
                  {variant.name} • {variant.sku}
                </div>
              </div>
              <div className="ml-2 shrink-0 font-semibold text-primary">
                {formatCurrency(variant.price)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
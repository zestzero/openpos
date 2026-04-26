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
    <div className="rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Search
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Type a name, SKU, or barcode and tap a result to add it to the cart.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-pill border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Fast add
        </span>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search name, SKU, or barcode"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 pl-10 text-base"
            aria-label="Search products"
          />
        </div>
        <Button type="submit" size="sm" variant="secondary" className="h-11 gap-2 px-4">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
        </Button>
        {query && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleClear}
            className="h-11 w-11"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {searchMutation.isPending && (
        <div className="py-3 text-center text-sm text-muted-foreground">
          Searching...
        </div>
      )}

      {hasSearched && results.length === 0 && (
        <div className="py-3 text-center text-sm text-muted-foreground">
          No products matched “{query}”.
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-border/70 bg-card shadow-sm">
          {results.map((variant) => (
            <button
              key={variant.id}
              type="button"
              className="flex w-full items-center justify-between gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/60"
              onClick={() => handleAddResult(variant)}
            >
              <div className="flex-1 truncate">
                <div className="font-medium leading-5">{variant.product_name}</div>
                <div className="text-sm text-muted-foreground">
                  {variant.name} • {variant.sku}
                </div>
              </div>
              <div className="shrink-0 rounded-pill bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {formatCurrency(variant.price)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

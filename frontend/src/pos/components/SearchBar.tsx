'use client'

import { useState } from 'react'
import { Barcode, Search } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useCart } from '@/pos/hooks/useCart'
import { useFavorites } from '@/pos/hooks/useFavorites'
import { toast } from 'sonner'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const { addItem } = useCart()
  const { recordAdd } = useFavorites()

  const searchMutation = useMutation({
    mutationFn: async (q: string) => {
      const result = await api.searchVariant(q)
      return result.data
    },
    onSuccess: (variant) => {
      const cartItem = {
        id: variant.id,
        product_id: variant.product_id,
        sku: variant.sku,
        barcode: variant.barcode ?? undefined,
        name: variant.name,
        price: variant.price,
        cost: variant.cost ?? undefined,
        is_active: variant.is_active,
        productName: variant.product_name,
      }

      addItem(cartItem)
      recordAdd(cartItem)
      setStatus(`Added ${variant.product_name}`)
      toast.success(`Added ${variant.product_name}`)
      setQuery('')
    },
    onError: (error) => {
      setStatus(error instanceof Error ? error.message : 'Product not found')
    },
  })

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    searchMutation.mutate(trimmed)
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products or scan barcode..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-[3.25rem] rounded-pill border-border/70 bg-background pl-12 pr-12 text-base shadow-card placeholder:text-muted-foreground/70 focus-visible:ring-brand"
          aria-label="Search products"
        />
        <button
          type="submit"
          aria-label="Search products"
          className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <Barcode className="h-4 w-4" />
        </button>
      </form>

      {searchMutation.isPending ? (
        <p className="text-sm text-muted-foreground">Searching catalog...</p>
      ) : null}

      {status ? (
        <p className="text-sm text-muted-foreground">{status}</p>
      ) : null}
    </div>
  )
}

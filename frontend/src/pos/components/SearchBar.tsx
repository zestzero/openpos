'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useCart } from '@/pos/hooks/useCart'
import { useFavorites } from '@/pos/hooks/useFavorites'
import { posCopy } from '@/pos/lib/copy'

interface SearchBarProps {
  onAdded?: (variantId: string, productName: string) => void
}

export function SearchBar({ onAdded }: SearchBarProps) {
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
      setStatus(null)
      onAdded?.(variant.id, variant.product_name)
      setQuery('')
    },
    onError: (error) => {
      setStatus(error instanceof Error ? error.message : posCopy.searchNotFound)
    },
  })

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    searchMutation.mutate(trimmed)
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSearch} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={posCopy.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 rounded-xl border-border bg-card pl-12 pr-4 text-lg placeholder:text-muted-foreground focus-visible:ring-ring"
          aria-label="Search products"
        />
      </form>

      {searchMutation.isPending ? (
        <p className="text-base text-muted-foreground">Searching…</p>
      ) : null}

      {status ? (
        <p className="text-base text-destructive">{status}</p>
      ) : null}
    </div>
  )
}

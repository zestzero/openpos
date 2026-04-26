'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEY_FAVORITES } from '@/lib/constants'

export interface FavoriteItem {
  variantId: string
  productName: string
  variantName: string
  price: number
  addCount: number // session frequency
}

interface FavoriteRecord {
  [variantId: string]: FavoriteItem
}

function loadFavoritesFromStorage(): FavoriteRecord {
  if (typeof window === 'undefined') return {}
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY_FAVORITES)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveFavoritesToStorage(favorites: FavoriteRecord): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites))
  } catch {
    // Ignore storage errors
  }
}

interface VariantWithProductName {
  id: string
  product_id: string
  sku: string
  barcode?: string
  name: string
  price: number
  cost?: number
  is_active: boolean
  productName: string
}

export interface UseFavoritesReturn {
  favorites: FavoriteItem[]
  recordAdd: (variant: VariantWithProductName) => void
}

export function useFavorites(): UseFavoritesReturn {
  const [favoritesMap, setFavoritesMap] = useState<FavoriteRecord>({})

  // Load from sessionStorage on mount
  useEffect(() => {
    const stored = loadFavoritesFromStorage()
    if (Object.keys(stored).length > 0) {
      setFavoritesMap(stored)
    }
  }, [])

  // Save to sessionStorage whenever favorites change
  useEffect(() => {
    saveFavoritesToStorage(favoritesMap)
  }, [favoritesMap])

  const recordAdd = useCallback((variant: VariantWithProductName) => {
    setFavoritesMap((prev) => {
      const existing = prev[variant.id]
      if (existing) {
        return {
          ...prev,
          [variant.id]: {
            ...existing,
            addCount: existing.addCount + 1,
          },
        }
      }
      return {
        ...prev,
        [variant.id]: {
          variantId: variant.id,
          productName: variant.productName,
          variantName: variant.name,
          price: variant.price,
          addCount: 1,
        },
      }
    })
  }, [])

  const favorites = useMemo(() => {
    return Object.values(favoritesMap)
      .sort((a, b) => b.addCount - a.addCount)
      .slice(0, 8)
  }, [favoritesMap])

  return {
    favorites,
    recordAdd,
  }
}
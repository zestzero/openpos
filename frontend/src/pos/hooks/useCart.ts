'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEY_CART } from '@/lib/constants'

export interface CartItem {
  variantId: string
  productName: string
  variantName: string
  sku: string
  price: number // satang
  quantity: number
  subtotal: number // satang
}

interface CartState {
  items: CartItem[]
  itemCount: number
  total: number // satang
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

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CART)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(items))
  } catch {
    // Ignore storage errors
  }
}

export interface UseCartReturn {
  items: CartItem[]
  itemCount: number
  total: number
  addItem: (variant: VariantWithProductName) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  isEmpty: boolean
}

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadCartFromStorage()
    if (stored.length > 0) {
      setItems(stored)
    }
  }, [])

  // Save to localStorage whenever items change
  useEffect(() => {
    saveCartToStorage(items)
  }, [items])

  const addItem = useCallback((variant: VariantWithProductName) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.variantId === variant.id)
      if (existing) {
        return prev.map((item) =>
          item.variantId === variant.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        )
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          productName: variant.productName,
          variantName: variant.name,
          sku: variant.sku,
          price: variant.price,
          quantity: 1,
          subtotal: variant.price,
        },
      ]
    })
  }, [])

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.variantId !== variantId)
      return filtered
    })
  }, [])

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId)
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      )
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items]
  )

  const isEmpty = useMemo(() => items.length === 0, [items])

  return {
    items,
    itemCount,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isEmpty,
  }
}
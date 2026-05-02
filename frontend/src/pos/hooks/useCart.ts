'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
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

interface VariantWithProductName {
  id: string
  product_id: string
  sku: string
  barcode?: string | null
  name: string
  price: number
  cost?: number | null
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

function getInitialCart(): CartItem[] {
  return loadCartFromStorage()
}

let cartItems = getInitialCart()
const cartListeners = new Set<() => void>()

function emitCartChange() {
  for (const listener of cartListeners) {
    listener()
  }
}

function setCartItems(updater: (items: CartItem[]) => CartItem[]) {
  cartItems = updater(cartItems)
  saveCartToStorage(cartItems)
  emitCartChange()
}

function subscribe(listener: () => void) {
  cartListeners.add(listener)

  return () => {
    cartListeners.delete(listener)
  }
}

export function __resetCartStoreForTests() {
  cartItems = loadCartFromStorage()
  emitCartChange()
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
  const items = useSyncExternalStore(subscribe, () => cartItems, () => cartItems)

  const addItem = useCallback((variant: VariantWithProductName) => {
    setCartItems((prev) => {
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
    setCartItems((prev) => {
      const filtered = prev.filter((item) => item.variantId !== variantId)
      return filtered
    })
  }, [])

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId)
      return
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      )
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setCartItems(() => [])
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

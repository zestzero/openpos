'use client'

import { ShoppingCart, Trash2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatCurrency'
import { api } from '@/lib/api'
import { getStoredSession } from '@/lib/auth'
import { useCart } from '@/pos/hooks/useCart'
import { useNetworkStatus } from '@/pos/hooks/useNetworkStatus'
import { useOfflineOrders } from '@/pos/hooks/useOfflineOrders'
import { CartItemRow } from './CartItemRow'
import { SyncStatus } from './SyncStatus'
import { toast } from 'sonner'

export function CartPanel() {
  const navigate = useNavigate()
  const { isOnline } = useNetworkStatus()
  const { queueOrder } = useOfflineOrders()
  const { items, itemCount, total, updateQuantity, removeItem, clearCart, isEmpty } =
    useCart()

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: { id: string; items: { variant_id: string; quantity: number; price_snapshot: number }[] }) => {
      return api.createOrder(orderData)
    },
    onSuccess: () => {
      clearCart()
      navigate({ to: '/pos' })
      toast.success('Sale completed successfully')
    },
    onError: (error) => {
      // If online request fails, fall back to offline queue
      void error
      void handleOfflineFallback()
    },
  })

  const handleOfflineFallback = async () => {
    const orderId = crypto.randomUUID()
    const session = getStoredSession()
    const orderItems = items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      priceSnapshot: item.price,
    }))

    await queueOrder({
      id: orderId,
      userId: session?.user.id ?? 'unknown',
      items: orderItems,
      total,
    })

    clearCart()
    toast.info('Order saved offline and will sync when connection returns')
  }

  const handleCompleteSale = async () => {
    const orderId = crypto.randomUUID()
    const orderItems = items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
      price_snapshot: item.price,
    }))

    if (isOnline) {
      // Try online first
      try {
        await createOrderMutation.mutateAsync({
          id: orderId,
          items: orderItems,
        })
      } catch {
        // Error handled in onError callback
      }
    } else {
      // Offline: queue locally
      await handleOfflineFallback()
    }
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Your cart is empty</p>
        <Button variant="outline" onClick={() => navigate({ to: '/pos/catalog' })}>
          Browse Catalog
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-lg font-semibold">Cart ({itemCount} items)</h2>
        <div className="flex items-center gap-3">
          <SyncStatus />
          <Button variant="ghost" size="sm" onClick={clearCart}>
            <Trash2 className="mr-1 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {items.map((item) => (
          <CartItemRow
            key={item.variantId}
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-muted-foreground">Item count:</span>
          <span className="font-medium">{itemCount}</span>
        </div>
        <div className="mb-4 flex items-center justify-between text-xl font-bold">
          <span>Total:</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
        <Button
          className="h-14 w-full text-lg font-semibold"
          onClick={handleCompleteSale}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? 'Processing...' : 'Complete Sale'}
        </Button>
        {!isOnline && (
          <p className="mt-2 text-center text-xs text-amber-600">
            Offline mode - order will be queued
          </p>
        )}
      </div>
    </div>
  )
}

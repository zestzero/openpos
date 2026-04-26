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
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-background text-muted-foreground">
          <ShoppingCart className="h-6 w-6" />
        </div>
        <p className="mt-4 text-lg font-semibold text-foreground">Cart is waiting</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Search, tap a quick key, or open the catalog to start a sale.
        </p>
        <Button className="mt-5 h-11 px-5" variant="outline" onClick={() => navigate({ to: '/pos/catalog' })}>
          Browse catalog
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border/70 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Review cart
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {itemCount} item{itemCount === 1 ? '' : 's'} ready to finish
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <SyncStatus />
          <Button variant="ghost" size="sm" onClick={clearCart}>
            <Trash2 className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="max-h-[32rem] overflow-y-auto p-2 sm:p-3">
        {items.map((item) => (
          <CartItemRow
            key={item.variantId}
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>

      <div className="border-t border-border/70 p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Item count</span>
          <span className="font-medium">{itemCount}</span>
        </div>
        <div className="mb-4 flex items-center justify-between text-xl font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
        <Button
          className="h-14 w-full rounded-2xl text-lg font-semibold"
          onClick={handleCompleteSale}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? 'Processing...' : 'Finish sale'}
        </Button>
        {!isOnline && (
          <p className="mt-2 text-center text-xs text-amber-600">
            Offline mode - order will be queued
          </p>
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Adjust quantities or remove a line item before finishing.
        </p>
      </div>
    </div>
  )
}

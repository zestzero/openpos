'use client'

import { ShoppingCart, Trash2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatCurrency'
import { api } from '@/lib/api'
import { useCart, type CartItem } from '@/pos/hooks/useCart'
import { CartItemRow } from './CartItemRow'

export function CartPanel() {
  const navigate = useNavigate()
  const { items, itemCount, total, updateQuantity, removeItem, clearCart, isEmpty } =
    useCart()

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: { id: string; items: { variant_id: string; quantity: number; price_snapshot: number }[] }) => {
      return api.createOrder(orderData)
    },
    onSuccess: () => {
      clearCart()
      navigate({ to: '/pos' })
    },
    onError: () => {
      // Handle error - in production would show toast
      alert('Failed to complete sale. Please try again.')
    },
  })

  const handleCompleteSale = () => {
    const orderId = crypto.randomUUID()
    const orderItems = items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
      price_snapshot: item.price,
    }))

    createOrderMutation.mutate({
      id: orderId,
      items: orderItems,
    })
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
        <Button variant="ghost" size="sm" onClick={clearCart}>
          <Trash2 className="mr-1 h-4 w-4" />
          Clear All
        </Button>
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
      </div>
    </div>
  )
}
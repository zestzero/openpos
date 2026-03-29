import { v4 as uuidv4 } from 'uuid';
import type { CartItem } from '@/stores/cart-store';
import type { OfflineOrder, OrderItem } from './db';
import { enqueueOrder } from './sync-queue';
import { getAuthToken } from './api-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function cartItemsToOrderItems(items: CartItem[]): OrderItem[] {
  return items.map(item => ({
    variant_id: item.variant_id,
    product_id: item.product_id,
    product_name: item.product_name,
    variant_sku: item.variant_sku,
    price_cents: item.price_cents,
    quantity: item.quantity,
    line_total_cents: item.price_cents * item.quantity,
  }));
}

export async function completeSale(cartItems: CartItem[]): Promise<{ orderId: string; synced: boolean }> {
  const orderId = uuidv4(); // Client generates UUID (per research: never let server assign for offline)
  const orderItems = cartItemsToOrderItems(cartItems);
  const totalCents = orderItems.reduce((sum, i) => sum + i.line_total_cents, 0);

  const order: OfflineOrder = {
    id: orderId,
    items: orderItems,
    total_cents: totalCents,
    status: 'pending_sync',
    created_at: Date.now(),
    synced_at: null,
    error: null,
  };

  if (navigator.onLine) {
    try {
      const token = getAuthToken();
      // Delta sync: POST order with items (variant_id + quantity).
      // Backend Sales service creates order, publishes order.completed event.
      // Inventory service subscribes and creates ledger entries: delta = -quantity per variant.
      // This is delta-based (OFF-04): we send "sold 2 of variant X", not "stock is now 8".
      const res = await fetch(`${API_BASE}/sales/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          order_id: orderId,
          items: orderItems.map(i => ({
            variant_id: i.variant_id,
            quantity: i.quantity,
            price_cents: i.price_cents,
          })),
          total_cents: totalCents,
          created_at: order.created_at,
        }),
      });

      if (res.ok) {
        order.status = 'synced';
        order.synced_at = Date.now();
        // Still save to local DB for receipt/history
        const { db } = await import('./db');
        await db.orders.put(order);
        return { orderId, synced: true };
      }
      // If server error, fall through to offline queue
    } catch {
      // Network error — fall through to offline queue
    }
  }

  // Offline path: queue for later sync
  await enqueueOrder(order);
  return { orderId, synced: false };
}

import { db, type SyncQueueEntry, type OfflineOrder } from './db';
import { getAuthToken } from './api-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s, 8s, 16s

function exponentialBackoff(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt);
}

export async function enqueueOrder(order: OfflineOrder): Promise<void> {
  await db.transaction('rw', [db.orders, db.syncQueue], async () => {
    await db.orders.put(order);
    await db.syncQueue.add({
      operation: 'CREATE_ORDER',
      payload: JSON.stringify({
        order_id: order.id,
        items: order.items.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          price_cents: item.price_cents,
        })),
        total_cents: order.total_cents,
        created_at: order.created_at,
      }),
      order_id: order.id,
      attempts: 0,
      max_attempts: MAX_ATTEMPTS,
      next_retry_at: Date.now(),
      created_at: Date.now(),
      last_error: null,
    });
  });
}

export async function processSyncQueue(): Promise<{ processed: number; failed: number }> {
  const token = getAuthToken();
  if (!token) return { processed: 0, failed: 0 };

  const now = Date.now();
  const pending = await db.syncQueue
    .where('next_retry_at')
    .belowOrEqual(now)
    .toArray();

  let processed = 0;
  let failed = 0;

  for (const entry of pending) {
    if (entry.attempts >= entry.max_attempts) {
      await db.orders.update(entry.order_id, { status: 'failed', error: entry.last_error });
      await db.syncQueue.delete(entry.id!);
      failed++;
      continue;
    }

    try {
      await db.orders.update(entry.order_id, { status: 'syncing' });

      const res = await fetch(`${API_BASE}/sales/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: entry.payload,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      await db.orders.update(entry.order_id, { status: 'synced', synced_at: Date.now() });
      await db.syncQueue.delete(entry.id!);
      processed++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      const nextAttempt = entry.attempts + 1;
      await db.syncQueue.update(entry.id!, {
        attempts: nextAttempt,
        last_error: errorMsg,
        next_retry_at: Date.now() + exponentialBackoff(nextAttempt),
      });
      await db.orders.update(entry.order_id, { status: 'pending_sync', error: errorMsg });
    }
  }

  return { processed, failed };
}

export async function getPendingSyncCount(): Promise<number> {
  return db.syncQueue.count();
}

export async function getFailedOrders(): Promise<OfflineOrder[]> {
  return db.orders.where('status').equals('failed').toArray();
}

import { useCallback, useEffect, useRef } from 'react'
import { useNetworkStatus } from './useNetworkStatus'
import { useOfflineOrders } from './useOfflineOrders'
import { requestJSON } from '@/lib/api'

const BASE_RETRY_MS = 2000
const MAX_RETRY_MS = 60000
const MAX_RETRIES = 10

export function useSync() {
  const { isOnline } = useNetworkStatus()
  const {
    getPendingOrders,
    markAsSyncing,
    markAsSynced,
    markAsFailed,
  } = useOfflineOrders()
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSyncingRef = useRef(false)

  const syncPendingOrders = useCallback(async () => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true

    try {
      const pending = await getPendingOrders()
      if (pending.length === 0) {
        isSyncingRef.current = false
        return
      }

      // Mark all as syncing
      await Promise.all(pending.map(o => markAsSyncing(o.id)))

      // Build sync payload
      const payload = {
        orders: pending.map(o => ({
          client_uuid: o.id,
          items: o.items.map(item => ({
            variant_id: item.variantId,
            quantity: item.quantity,
            unit_price: item.priceSnapshot,
          })),
        })),
      }

      // Send to server - backend route is /api/orders/sync
      const result = await requestJSON<{ data: { processed: number; failed: number; errors?: Array<{ order_id: string; error: string }> } }>(
        '/api/orders/sync',
        { method: 'POST', body: JSON.stringify(payload) }
      )

      // Process results
      const failedOrderIds = new Set(result.data.errors?.map(e => e.order_id) ?? [])

      for (const order of pending) {
        if (failedOrderIds.has(order.id)) {
          const error = result.data.errors?.find(e => e.order_id === order.id)?.error ?? 'Sync failed'
          if (order.retryCount >= MAX_RETRIES) {
            // Permanently failed - could alert user in v2
            await markAsFailed(order.id, `Max retries exceeded: ${error}`)
          } else {
            await markAsFailed(order.id, error)
          }
        } else {
          await markAsSynced(order.id)
        }
      }
    } catch (error) {
      // Network or server error - mark all syncing orders as failed for retry
      const syncing = await getPendingOrders() // re-fetch (status='syncing' now)
      for (const order of syncing) {
        await markAsFailed(order.id, error instanceof Error ? error.message : 'Network error')
      }
    } finally {
      isSyncingRef.current = false
    }
  }, [getPendingOrders, markAsSyncing, markAsSynced, markAsFailed])

  const scheduleRetry = useCallback(() => {
    // Exponential backoff based on highest retry count among pending orders
    getPendingOrders().then(pending => {
      if (pending.length === 0) return
      const maxRetries = Math.max(...pending.map(o => o.retryCount))
      const delay = Math.min(BASE_RETRY_MS * Math.pow(2, maxRetries), MAX_RETRY_MS)

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      syncTimeoutRef.current = setTimeout(() => {
        if (isOnline) {
          syncPendingOrders()
        }
      }, delay)
    })
  }, [getPendingOrders, isOnline, syncPendingOrders])

  // Trigger sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncPendingOrders()
    }
  }, [isOnline, syncPendingOrders])

  // Schedule retry after a sync attempt completes (if there are still pending)
  useEffect(() => {
    if (!isOnline) return
    scheduleRetry()
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [isOnline, scheduleRetry])

  return { syncPendingOrders }
}
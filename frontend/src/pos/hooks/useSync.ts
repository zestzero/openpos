import { useCallback, useEffect, useRef } from 'react'
import { useNetworkStatus } from './useNetworkStatus'
import { useOfflineOrders } from './useOfflineOrders'
import { requestJSON } from '@/lib/api'
import { db } from '@/lib/db'
import { buildSyncOrdersRequest, collectFailedClientUUIDs, getNextRetryDelayMs, type SyncOrdersResponse } from './syncContract'
const MAX_RETRIES = 10

export function useSync() {
  const { isOnline } = useNetworkStatus()
  const {
    getAllQueuedOrders,
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
      const queuedOrders = await getAllQueuedOrders()
      const retryableOrders = queuedOrders.filter(order => order.status !== 'syncing')
      if (retryableOrders.length === 0) {
        isSyncingRef.current = false
        return
      }

      // Mark all as syncing
      await Promise.all(retryableOrders.map(o => markAsSyncing(o.id)))

      // Send to server - backend route is /api/orders/sync
      const result = await requestJSON<{ data: SyncOrdersResponse }>(
        '/api/orders/sync',
        { method: 'POST', body: JSON.stringify(buildSyncOrdersRequest(retryableOrders)) }
      )

      // Process results
      const failedByClientUUID = collectFailedClientUUIDs(result.data.errors)

      for (const order of retryableOrders) {
        if (failedByClientUUID.has(order.id)) {
          const error = failedByClientUUID.get(order.id) ?? 'Sync failed'
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

      await db.syncState.update('default', { lastSyncAt: Date.now() })
    } catch (error) {
      // Network or server error - mark all syncing orders as failed for retry
      const syncing = (await getAllQueuedOrders()).filter(order => order.status === 'syncing')
      for (const order of syncing) {
        await markAsFailed(order.id, error instanceof Error ? error.message : 'Network error')
      }
    } finally {
      isSyncingRef.current = false
    }
  }, [getAllQueuedOrders, markAsSyncing, markAsSynced, markAsFailed])

  const scheduleRetry = useCallback(() => {
    // Exponential backoff based on highest retry count among pending orders
    getAllQueuedOrders().then(queuedOrders => {
      const retryable = queuedOrders.filter(order => order.status !== 'syncing')
      if (retryable.length === 0) return
      const maxRetries = Math.max(...retryable.map(o => o.retryCount))
      const delay = getNextRetryDelayMs(maxRetries)

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      syncTimeoutRef.current = setTimeout(() => {
        if (isOnline) {
          syncPendingOrders()
        }
      }, delay)
    })
  }, [getAllQueuedOrders, isOnline, syncPendingOrders])

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

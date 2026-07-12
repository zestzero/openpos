import { useCallback, useEffect, useRef } from 'react'
import { useNetworkStatus } from './useNetworkStatus'
import { useOfflineOrders } from './useOfflineOrders'
import { useOfflineAdjustments } from './useOfflineAdjustments'
import { api, requestJSON } from '@/lib/api'
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

  const {
    getAllQueuedAdjustments,
    markAsSyncing: markAdjAsSyncing,
    markAsSynced: markAdjAsSynced,
    markAsFailed: markAdjAsFailed,
  } = useOfflineAdjustments()

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSyncingRef = useRef(false)
  const isSyncingAdjRef = useRef(false)

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

  const syncPendingAdjustments = useCallback(async () => {
    if (isSyncingAdjRef.current) return false
    isSyncingAdjRef.current = true

    try {
      const queuedAdjustments = await getAllQueuedAdjustments()
      const retryableAdjustments = queuedAdjustments.filter(adj => adj.status !== 'syncing')
      if (retryableAdjustments.length === 0) {
        isSyncingAdjRef.current = false
        return true
      }

      // Mark all as syncing
      await Promise.all(retryableAdjustments.map(adj => markAdjAsSyncing(adj.id)))

      // Send to server
      const payload = {
        adjustments: retryableAdjustments.map(adj => ({
          id: adj.id,
          variant_id: adj.variantId,
          quantity: adj.quantity,
          reason: adj.reason,
        }))
      }

      const result = await api.syncAdjustments(payload)

      // Process results
      const failedMap = new Map(result.data.errors.map(err => [err.id, err.error]))

      for (const adj of retryableAdjustments) {
        if (failedMap.has(adj.id)) {
          const errorMsg = failedMap.get(adj.id) ?? 'Sync failed'
          await markAdjAsFailed(adj.id, errorMsg)
        } else {
          await markAdjAsSynced(adj.id)
        }
      }
      return result.data.failed === 0
    } catch (error) {
      // Network or server error - mark all syncing adjustments as failed for retry
      const syncing = (await getAllQueuedAdjustments()).filter(adj => adj.status === 'syncing')
      for (const adj of syncing) {
        await markAdjAsFailed(adj.id, error instanceof Error ? error.message : 'Network error')
      }
      return false
    } finally {
      isSyncingAdjRef.current = false
    }
  }, [getAllQueuedAdjustments, markAdjAsSyncing, markAdjAsSynced, markAdjAsFailed])

  const scheduleRetry = useCallback(() => {
    // Exponential backoff based on highest retry count among pending orders/adjustments
    Promise.all([getAllQueuedOrders(), getAllQueuedAdjustments()]).then(([queuedOrders, queuedAdjustments]) => {
      const retryableOrders = queuedOrders.filter(order => order.status !== 'syncing')
      const retryableAdjustments = queuedAdjustments.filter(adj => adj.status !== 'syncing')

      if (retryableOrders.length === 0 && retryableAdjustments.length === 0) return

      const maxOrderRetries = retryableOrders.length > 0 ? Math.max(...retryableOrders.map(o => o.retryCount)) : 0
      const maxAdjRetries = retryableAdjustments.length > 0 ? Math.max(...retryableAdjustments.map(a => a.retryCount)) : 0
      const maxRetries = Math.max(maxOrderRetries, maxAdjRetries)

      const delay = getNextRetryDelayMs(maxRetries)

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      syncTimeoutRef.current = setTimeout(() => {
        if (isOnline) {
          syncPendingOrders()
          syncPendingAdjustments()
        }
      }, delay)
    })
  }, [getAllQueuedOrders, getAllQueuedAdjustments, isOnline, syncPendingOrders, syncPendingAdjustments])

  // Trigger sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncPendingOrders()
      syncPendingAdjustments()
    }
  }, [isOnline, syncPendingOrders, syncPendingAdjustments])

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

  return { syncPendingOrders, syncPendingAdjustments }
}

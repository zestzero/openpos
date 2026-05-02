import { useCallback } from 'react'
import { db, type QueuedOrder } from '@/lib/db'
import { deriveSyncSnapshot } from './syncContract'

async function updateSyncState() {
  const queuedOrders = await db.queuedOrders.toArray()
  const existing = await db.syncState.get('default')
  await db.syncState.put(deriveSyncSnapshot(queuedOrders, existing))
}

export function useOfflineOrders() {
  const queueOrder = useCallback(async (order: Omit<QueuedOrder, 'status' | 'retryCount' | 'createdAt'>) => {
    const queued: QueuedOrder = {
      ...order,
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    }
    await db.queuedOrders.add(queued)
    await updateSyncState()
    return queued
  }, [])

  const getPendingOrders = useCallback(async () => {
    return db.queuedOrders.where('status').equals('pending').toArray()
  }, [])

  const getAllQueuedOrders = useCallback(async () => {
    return db.queuedOrders.toArray()
  }, [])

  const markAsSyncing = useCallback(async (orderId: string) => {
    await db.queuedOrders.update(orderId, { status: 'syncing' })
    await updateSyncState()
  }, [])

  const markAsSynced = useCallback(async (orderId: string) => {
    await db.queuedOrders.delete(orderId)
    await updateSyncState()
  }, [])

  const markAsFailed = useCallback(async (orderId: string, error: string) => {
    const order = await db.queuedOrders.get(orderId)
    if (order) {
      await db.queuedOrders.update(orderId, {
        status: 'failed',
        retryCount: order.retryCount + 1,
        lastError: error,
      })
    }
    await updateSyncState()
  }, [])

  const getPendingCount = useCallback(async () => {
    return db.queuedOrders.where('status').equals('pending').count()
  }, [])

  return {
    queueOrder,
    getPendingOrders,
    getAllQueuedOrders,
    markAsSyncing,
    markAsSynced,
    markAsFailed,
    getPendingCount,
  }
}

import { useCallback } from 'react'
import { db, type QueuedAdjustment } from '@/lib/db'

export function useOfflineAdjustments() {
  const queueAdjustment = useCallback(async (adjustment: Omit<QueuedAdjustment, 'status' | 'retryCount' | 'createdAt'>) => {
    const queued: QueuedAdjustment = {
      ...adjustment,
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    }
    await db.queuedAdjustments.add(queued)
    return queued
  }, [])

  const getPendingAdjustments = useCallback(async () => {
    return db.queuedAdjustments.where('status').equals('pending').toArray()
  }, [])

  const getAllQueuedAdjustments = useCallback(async () => {
    return db.queuedAdjustments.toArray()
  }, [])

  const markAsSyncing = useCallback(async (adjId: string) => {
    await db.queuedAdjustments.update(adjId, { status: 'syncing' })
  }, [])

  const markAsSynced = useCallback(async (adjId: string) => {
    await db.queuedAdjustments.delete(adjId)
  }, [])

  const markAsFailed = useCallback(async (adjId: string, error: string) => {
    const adj = await db.queuedAdjustments.get(adjId)
    if (adj) {
      await db.queuedAdjustments.update(adjId, {
        status: 'failed',
        retryCount: adj.retryCount + 1,
        lastError: error,
      })
    }
  }, [])

  const clearAdjustment = useCallback(async (adjId: string) => {
    await db.queuedAdjustments.delete(adjId)
  }, [])

  return {
    queueAdjustment,
    getPendingAdjustments,
    getAllQueuedAdjustments,
    markAsSyncing,
    markAsSynced,
    markAsFailed,
    clearAdjustment,
  }
}

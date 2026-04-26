'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, WifiOff } from 'lucide-react'
import { db } from '@/lib/db'
import { useNetworkStatus } from '@/pos/hooks/useNetworkStatus'

export function SyncStatus() {
  const { isOnline } = useNetworkStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const updateState = async () => {
      const syncState = await db.syncState.get('default')
      if (syncState) {
        setPendingCount(syncState.pendingCount)
        setIsSyncing(syncState.isSyncing)
      }
    }

    updateState()

    // Poll for changes every 2 seconds
    const interval = setInterval(updateState, 2000)
    return () => clearInterval(interval)
  }, [])

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <WifiOff className="h-4 w-4 text-red-500" />
        <span className="text-red-600">Offline</span>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-blue-600">Syncing...</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <span className="text-amber-600">{pendingCount} order{pendingCount !== 1 ? 's' : ''} pending</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <CheckCircle className="h-4 w-4 text-green-500" />
      <span className="text-green-600">Synced</span>
    </div>
  )
}
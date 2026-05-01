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
      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-sm text-foreground">
        <WifiOff className="h-4 w-4 text-amber-600" />
        <span className="text-amber-700">Offline</span>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-sm text-foreground">
        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-blue-700">Syncing...</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-sm text-foreground">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <span className="text-amber-700">{pendingCount} order{pendingCount !== 1 ? 's' : ''} pending</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-sm text-foreground">
      <CheckCircle className="h-4 w-4 text-emerald-600" />
      <span className="text-emerald-700">Synced</span>
    </div>
  )
}

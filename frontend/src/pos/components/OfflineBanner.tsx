'use client'

import { useNetworkStatus } from '@/pos/hooks/useNetworkStatus'

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus()

  if (isOnline) return null

  return (
    <div className="animate-in slide-in-from-top-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-foreground">
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        <span>You are offline. Orders will sync when connection returns.</span>
      </div>
    </div>
  )
}

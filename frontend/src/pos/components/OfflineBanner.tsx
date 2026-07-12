'use client'

import { useNetworkStatus } from '@/pos/hooks/useNetworkStatus'
import { posCopy } from '@/pos/lib/copy'

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus()

  if (isOnline) return null

  return (
    <div className="border-b border-warning/30 bg-warning-soft px-4 py-2 text-center text-warning-foreground">
      <div className="flex items-center justify-center gap-2 text-base font-semibold">
        <span className="inline-block size-2.5 rounded-full bg-warning" aria-hidden="true" />
        <span>{posCopy.savedOnPhoneHelp}</span>
      </div>
    </div>
  )
}

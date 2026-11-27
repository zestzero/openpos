'use client'

import { Button } from '@/components/ui/button'
import { usePosCopy } from '@/pos/lib/copy'

import { useLatestReceipt } from '@/pos/hooks/useLatestReceipt'

export function LatestReceiptReprint() {
  const posCopy = usePosCopy()
  const {
    latestReceiptId,
    isOnline,
    isReprinting,
    replayError,
    reprintLatestReceipt,
  } = useLatestReceipt()

  if (!latestReceiptId) {
    return null
  }

  const statusCopy = replayError ?? (isOnline ? posCopy.reprintDescription : posCopy.reprintOffline)

  return (
    <div className="rounded-card border border-border/70 bg-background/95 px-3 py-3 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">{posCopy.latestReceipt}</p>
          <p className="text-xs leading-5 text-muted-foreground">{statusCopy}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!isOnline || isReprinting}
          onClick={() => {
            void reprintLatestReceipt()
          }}
        >
          {isReprinting ? posCopy.reprinting : posCopy.reprintButton}
        </Button>
      </div>
    </div>
  )
}

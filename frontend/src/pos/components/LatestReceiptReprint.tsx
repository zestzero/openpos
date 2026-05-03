'use client'

import { Button } from '@/components/ui/button'

import { useLatestReceipt } from '@/pos/hooks/useLatestReceipt'

export function LatestReceiptReprint() {
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

  const statusCopy = replayError ?? (isOnline
    ? 'Reprint the latest paid order without changing the current sale.'
    : 'Reprint receipt is unavailable while offline. Reconnect to print the saved receipt.')

  return (
    <div className="rounded-card border border-border/70 bg-background/95 px-3 py-3 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">Latest receipt</p>
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
          {isReprinting ? 'Reprinting...' : 'Reprint receipt'}
        </Button>
      </div>
    </div>
  )
}

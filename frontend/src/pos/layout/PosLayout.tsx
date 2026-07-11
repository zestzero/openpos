import type { ReactNode } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { OfflineBanner } from '@/pos/components/OfflineBanner'
import { PosHeader } from '@/pos/components/PosHeader'
import { useNetworkStatus } from '@/pos/hooks/useNetworkStatus'

interface PosLayoutProps {
  children?: ReactNode
  bottomAction?: ReactNode
}

export function PosLayout({ children, bottomAction }: PosLayoutProps) {
  const { user } = useAuth()
  const { isOnline } = useNetworkStatus()

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PosHeader user={user} online={isOnline} />
      <OfflineBanner />
      <main className={`mx-auto w-full max-w-2xl px-4 pt-5 ${bottomAction ? 'pb-32' : 'pb-8'}`}>
        {children}
      </main>
      {bottomAction ? (
        <div className="safe-area-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background px-4 pt-3">
          <div className="mx-auto w-full max-w-2xl">{bottomAction}</div>
        </div>
      ) : null}
    </div>
  )
}

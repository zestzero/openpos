import { useEffect, useState, type ReactNode } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { OfflineBanner } from '@/pos/components/OfflineBanner'
import { PosHeader } from '@/pos/components/PosHeader'
import { PosNav } from '@/pos/components/PosNav'

interface PosLayoutProps {
  children?: ReactNode
}

function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online
}

export function PosLayout({ children }: PosLayoutProps) {
  const { user } = useAuth()
  const online = useOnlineStatus()

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed right-[-12%] top-[-14%] -z-10 h-[52%] w-[52%] rounded-full bg-brand/8 blur-[140px]" />
      <div className="pointer-events-none fixed bottom-[-10%] left-[-10%] -z-10 h-[42%] w-[42%] rounded-full bg-brand/5 blur-[120px]" />
      <PosHeader user={user} online={online} />
      <OfflineBanner />

      <main className="flex-1 overflow-y-auto px-4 pb-32 pt-4 sm:px-6 sm:pt-6">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
          {children}
        </div>
      </main>

      <PosNav />
    </div>
  )
}

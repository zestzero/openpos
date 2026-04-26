import { useEffect, useState, type ReactNode } from 'react'

import { useAuth } from '@/hooks/useAuth'
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
  const { user, logout } = useAuth()
  const online = useOnlineStatus()

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <PosHeader user={user} online={online} onLogout={logout} />

      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          {children}
        </div>
      </main>

      <PosNav />
    </div>
  )
}

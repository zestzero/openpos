import { LogOut, Store, Wifi, WifiOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { AuthUser } from '@/lib/auth'

interface PosHeaderProps {
  user: AuthUser | null
  online: boolean
  onLogout: () => void
}

export function PosHeader({ user, online, onLogout }: PosHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-card bg-primary text-primary-foreground shadow-button">
          <Store className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">OpenPOS</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.name || user?.email || 'Signed in'} · {user?.role ?? 'guest'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-pill border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-card">
          {online ? <Wifi className="h-3.5 w-3.5 text-brand-foreground" /> : <WifiOff className="h-3.5 w-3.5 text-destructive" />}
          <span>{online ? 'Online' : 'Offline'}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

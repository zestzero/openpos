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
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Store className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">OpenPOS</p>
          <p className="truncate text-xs text-slate-500">
            {user?.name || user?.email || 'Signed in'} · {user?.role ?? 'guest'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {online ? <Wifi className="h-3.5 w-3.5 text-emerald-600" /> : <WifiOff className="h-3.5 w-3.5 text-rose-600" />}
          <span>{online ? 'Online' : 'Offline'}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

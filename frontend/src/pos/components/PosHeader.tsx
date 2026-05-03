import { Bell, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import type { AuthUser } from '@/lib/auth'

interface PosHeaderProps {
  user: AuthUser | null
  online: boolean
}

export function PosHeader({ user, online }: PosHeaderProps) {
  const { logout } = useAuth()
  const avatarLabel = (user?.name || user?.email || 'OpenPOS').slice(0, 1).toUpperCase()

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/70 bg-card/95 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-sm font-semibold text-foreground shadow-card">
            {avatarLabel}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">POS Terminal</h1>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${online ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' : 'border-amber-500/20 bg-amber-500/10 text-amber-700'}`}>
                {online ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{user?.name || user?.email || 'Signed in'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.98]"
            aria-label="Notifications"
            onClick={() => undefined}
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

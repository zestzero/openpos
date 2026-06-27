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
    <header className="sticky top-0 z-30 w-full bg-white">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-sm font-bold text-brand">
            {avatarLabel}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold text-gray-900">POS Terminal</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${online ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {online ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="truncate text-xs font-medium text-gray-500">{user?.name || user?.email || 'Signed in'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Notifications"
            onClick={() => undefined}
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 sm:w-auto sm:px-4"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline font-semibold">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

import { ChevronDown, LogOut, PackageSearch, ReceiptText, ShoppingBasket } from 'lucide-react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import type { AuthUser } from '@/lib/auth'
import { useLatestReceipt } from '@/pos/hooks/useLatestReceipt'
import { posCopy } from '@/pos/lib/copy'

interface PosHeaderProps {
  user: AuthUser | null
  online: boolean
}

export function PosHeader({ user, online }: PosHeaderProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { latestReceiptId, isOnline, isReprinting, reprintLatestReceipt } = useLatestReceipt()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex min-h-16 w-full max-w-2xl items-center justify-between gap-3 px-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-foreground">OpenPOS</h1>
          <p className="flex items-center gap-2 text-base text-muted-foreground">
            <span className={`size-2.5 rounded-full ${online ? 'bg-success' : 'bg-warning'}`} aria-hidden="true" />
            {online ? posCopy.online : posCopy.offline}
          </p>
        </div>

        <details className="group relative">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-xl border border-border bg-card px-4 text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
            {posCopy.tasks}
            <ChevronDown aria-hidden="true" className="size-5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute right-0 top-14 flex w-64 flex-col gap-1 rounded-xl border border-border bg-popover p-2 shadow-dialog">
            {pathname === '/pos' ? (
              <Button variant="ghost" className="min-h-12 justify-start text-base" onClick={() => navigate({ to: '/pos/inventory' })}>
                <PackageSearch data-icon="inline-start" />
                {posCopy.inventory}
              </Button>
            ) : (
              <Button variant="ghost" className="min-h-12 justify-start text-base" onClick={() => navigate({ to: '/pos' })}>
                <ShoppingBasket data-icon="inline-start" />
                {posCopy.selling}
              </Button>
            )}
            {latestReceiptId ? (
              <Button
                variant="ghost"
                className="min-h-12 justify-start text-base"
                disabled={!isOnline || isReprinting}
                onClick={() => void reprintLatestReceipt()}
              >
                <ReceiptText data-icon="inline-start" />
                {posCopy.reprintReceipt}
              </Button>
            ) : null}
            <div className="border-t border-border pt-1">
              <Button variant="ghost" className="min-h-12 w-full justify-start text-base" onClick={logout}>
                <LogOut data-icon="inline-start" />
                {posCopy.signOut}{user?.name ? ` · ${user.name}` : ''}
              </Button>
            </div>
          </div>
        </details>
      </div>
    </header>
  )
}

import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/formatCurrency'
import { OfflineBanner } from '@/pos/components/OfflineBanner'
import { CartPanel } from '@/pos/components/CartPanel'
import { PosHeader } from '@/pos/components/PosHeader'
import { PosNav } from '@/pos/components/PosNav'
import { useCart } from '@/pos/hooks/useCart'
import { useNetworkStatus } from '@/pos/hooks/useNetworkStatus'

interface PosLayoutProps {
  children?: ReactNode
}

export function PosLayout({ children }: PosLayoutProps) {
  const { user } = useAuth()
  const { isOnline: online } = useNetworkStatus()
  const { itemCount, total } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <PosHeader user={user} online={online} />
      <OfflineBanner />

      <main className="flex-1 overflow-y-auto px-4 pb-32 pt-4 sm:px-6 sm:pt-6">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
          {children}
        </div>
      </main>

      <PosNav />

      <div className="safe-area-bottom fixed bottom-24 left-1/2 z-40 w-full max-w-[500px] -translate-x-1/2 px-6 md:hidden">
        <Button
          type="button"
          className="flex h-14 w-full items-center justify-between rounded-full bg-brand px-6 py-4 text-brand-foreground shadow-lg transition-transform active:scale-95"
          onClick={() => setCartOpen(true)}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
              {itemCount}
            </span>
            <span className="text-sm font-semibold text-white">View cart</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            {formatCurrency(total)}
          </span>
        </Button>
      </div>

      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="left-1/2 top-auto bottom-0 h-[80dvh] w-[min(100vw-1rem,56rem)] max-w-none translate-x-[-50%] translate-y-0 rounded-b-none rounded-t-3xl border-b-0 p-0 sm:w-[min(100vw-2rem,56rem)]">
          <div className="flex h-full flex-col overflow-hidden">
            <DialogHeader className="border-b border-border/70 px-6 pb-4 pt-6 text-left">
              <DialogTitle className="text-xl font-bold">Cart</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 sm:px-6">
              <CartPanel compact />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* eslint-disable react-refresh/only-export-components */

import { useState } from 'react'
import { createRoute } from '@tanstack/react-router'

import { getStoredSession, hasRole } from '@/lib/auth'
import { useCart } from '@/pos/hooks/useCart'
import { formatCurrency } from '@/lib/formatCurrency'
import { CatalogCategoryNav } from '@/pos/components/CatalogCategoryNav'
import { CatalogGrid } from '@/pos/components/CatalogGrid'
import { CartPanel } from '@/pos/components/CartPanel'
import { SearchBar } from '@/pos/components/SearchBar'
import { QuickKeysBar } from '@/pos/components/QuickKeysBar'
import { PosLayout } from '@/pos/layout/PosLayout'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'pos',
  beforeLoad: () => {
    const session = getStoredSession()
    if (!session) return
    if (!hasRole(session.user.role, ['owner', 'cashier'])) return
  },
  component: PosRoute,
})

function PosRoute() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { itemCount, total } = useCart()

  return (
    <PosLayout>
      <div className="w-full space-y-6 pb-40">
        <section className="rounded-card border border-border/70 bg-card p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Selling floor</p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">Keep the register moving without losing the thread.</h2>
              <p className="max-w-prose text-sm leading-6 text-muted-foreground sm:text-base">
                Search fast, pin repeat sellers, and keep the cart visible while the line keeps moving.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-3 py-1.5">{itemCount} items</span>
              <span className="rounded-full border border-border bg-background px-3 py-1.5">{formatCurrency(total)} in cart</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 rounded-full border border-border bg-background p-1.5">
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-card">Register</button>
            <button className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Stock Management</button>
          </div>

          <div className="mt-4 space-y-3">
            <SearchBar />
            <QuickKeysBar />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="shrink-0">
              <CatalogCategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.85fr)]">
          <div className="space-y-3">
            <CatalogGrid categoryId={selectedCategory} />
          </div>

          <aside id="cart-panel" className="scroll-mt-24 xl:sticky xl:top-24 xl:self-start">
            <CartPanel />
          </aside>
        </section>
      </div>

      <div className="safe-area-bottom fixed bottom-24 left-1/2 z-40 w-full max-w-[500px] -translate-x-1/2 px-6 xl:hidden">
        <a
          href="#cart-panel"
          className="flex w-full items-center justify-between rounded-full border border-border bg-foreground px-5 py-4 text-background shadow-[0_14px_30px_rgba(0,0,0,0.14)] transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-background/10 text-xs font-semibold text-background">
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-foreground">
                {itemCount}
              </span>
              <span className="text-xs font-semibold">Cart</span>
            </span>
            <span className="text-sm font-semibold">View cart</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">{formatCurrency(total)}</span>
        </a>
      </div>
    </PosLayout>
  )
}

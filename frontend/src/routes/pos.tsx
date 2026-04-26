import { useState } from 'react'
import { Link, createRoute } from '@tanstack/react-router'

import { getStoredSession, hasRole } from '@/lib/auth'
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

  return (
    <PosLayout>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.95fr)]">
        <div className="space-y-4">
          <section className="rounded-[1.75rem] border border-border/70 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Fast sell mode
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Find item, tap quick key, and finish the sale without leaving the flow.
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                  Search by name, SKU, or barcode, then move straight into the cart.
                </p>
              </div>

              <Link
                to="/pos/scan"
                className="inline-flex h-11 items-center justify-center rounded-pill border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Open scan mode
              </Link>
            </div>

            <div className="mt-4">
              <SearchBar />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Quick keys
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Repeat sellers stay one tap away.
                </p>
              </div>
            </div>

            <QuickKeysBar />
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Catalog browse
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep the shelf visible so item discovery never feels like a detour.
              </p>
            </div>

            <CatalogCategoryNav
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <CatalogGrid categoryId={selectedCategory} />
          </section>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <CartPanel />
        </aside>
      </div>
    </PosLayout>
  )
}

/* eslint-disable react-refresh/only-export-components */

import { useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { getStoredSession, hasRole } from "@/lib/auth";
import { useCart } from "@/pos/hooks/useCart";
import { formatCurrency } from "@/lib/formatCurrency";
import { CatalogCategoryNav } from "@/pos/components/CatalogCategoryNav";
import { CatalogGrid } from "@/pos/components/CatalogGrid";
import { CartPanel } from "@/pos/components/CartPanel";
import { SearchBar } from "@/pos/components/SearchBar";
import { QuickKeysBar } from "@/pos/components/QuickKeysBar";
import { PosLayout } from "@/pos/layout/PosLayout";
import { Route as rootRoute } from "./__root";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "pos",
  beforeLoad: () => {
    const session = getStoredSession();
    if (!session) return;
    if (!hasRole(session.user.role, ["owner", "cashier"])) return;
  },
  component: PosRoute,
});

export function PosRoute() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { itemCount, total } = useCart();

  return (
    <PosLayout>
      <div className="w-full space-y-6 pb-40">
        <div className="mt-4 space-y-3">
          <SearchBar />

          <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-3 py-1.5">
              {itemCount} items
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1.5">
              {formatCurrency(total)} in cart
            </span>
          </div>
        </div>

        <QuickKeysBar />

        <section className="space-y-3">
          <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="shrink-0">
              <CatalogCategoryNav
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.85fr)]">
          <div className="space-y-3">
            <CatalogGrid categoryId={selectedCategory} />
          </div>

          <aside
            id="cart-panel"
            className="scroll-mt-24 xl:sticky xl:top-24 xl:self-start"
          >
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
          <span className="text-lg font-semibold tracking-tight">
            {formatCurrency(total)}
          </span>
        </a>
      </div>
    </PosLayout>
  );
}

/* eslint-disable react-refresh/only-export-components */

import { useState, useCallback } from "react";
import { createRoute, redirect } from "@tanstack/react-router";
import { ScanBarcode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { getStoredSession } from "@/lib/auth";
import { canAccessRoute, getLandingPath } from '@/hooks/useRbac'
import { useCart } from "@/pos/hooks/useCart";
import { useFavorites } from "@/pos/hooks/useFavorites";
import { useKeyboardWedge } from "@/pos/hooks/useKeyboardWedge";
import { BarcodeScanner } from "@/pos/components/BarcodeScanner";
import { formatCurrency } from "@/lib/formatCurrency";
import { CatalogCategoryNav } from "@/pos/components/CatalogCategoryNav";
import { CatalogGrid } from "@/pos/components/CatalogGrid";
import { CartPanel } from "@/pos/components/CartPanel";
import { LatestReceiptReprint } from "@/pos/components/LatestReceiptReprint";
import { SearchBar } from "@/pos/components/SearchBar";
import { QuickKeysBar } from "@/pos/components/QuickKeysBar";
import { PosLayout } from "@/pos/layout/PosLayout";
import { Route as rootRoute } from "./__root";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "pos",
  beforeLoad: () => {
    const session = getStoredSession();
    if (!session?.user?.role) {
      throw redirect({ to: '/login' } as any)
    }
    if (!canAccessRoute(session.user.role, 'pos')) {
      throw redirect({ to: getLandingPath(session.user.role) as any } as any)
    }
  },
  component: PosRoute,
});

export function PosRoute() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { itemCount, total, addItem } = useCart();
  const { recordAdd } = useFavorites();

  const handleBarcodeScan = useCallback(async (code: string) => {
    try {
      const response = await api.searchVariant(code);
      const variant = response.data;
      const cartItem = {
        id: variant.id,
        product_id: variant.product_id,
        sku: variant.sku,
        barcode: variant.barcode ?? undefined,
        name: variant.name,
        price: variant.price,
        cost: variant.cost ?? undefined,
        is_active: variant.is_active,
        productName: variant.product_name,
      };

      addItem(cartItem);
      recordAdd(cartItem);
      toast.success(`Added ${variant.product_name} (${variant.name})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Product not found');
    }
  }, [addItem, recordAdd]);

  // Listen for wedge scanner in the background
  useKeyboardWedge({
    onScan: handleBarcodeScan,
  });

  return (
    <PosLayout>
      <div className="w-full space-y-6 pb-40">
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchBar />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-[3.25rem] w-[3.25rem] rounded-full border-border/70 bg-background shadow-card text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setIsScannerOpen(true)}
              aria-label="Scan barcode with camera"
            >
              <ScanBarcode className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-3 py-1.5">
              {itemCount} items
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1.5">
              {formatCurrency(total)} in cart
            </span>
          </div>

          <LatestReceiptReprint />
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

        <section className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
          <div className="space-y-3">
            <CatalogGrid categoryId={selectedCategory} />
          </div>

          <aside className="hidden md:block md:sticky md:top-24 md:self-start">
            <CartPanel />
          </aside>
        </section>
      </div>

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="max-w-md rounded-[1.75rem]">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>
          <BarcodeScanner
            onScanSuccess={(variant) => {
              const cartItem = {
                id: variant.id,
                product_id: variant.product_id,
                sku: variant.sku,
                barcode: variant.barcode ?? undefined,
                name: variant.name,
                price: variant.price,
                cost: variant.cost ?? undefined,
                is_active: variant.is_active,
                productName: variant.product_name,
              };
              addItem(cartItem);
              recordAdd(cartItem);
              toast.success(`Added ${variant.product_name} (${variant.name})`);
            }}
            onScanError={(_code, err) => {
              toast.error(err);
            }}
          />
        </DialogContent>
      </Dialog>
    </PosLayout>
  );
}

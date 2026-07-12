/* eslint-disable react-refresh/only-export-components */

import { useCallback, useEffect, useState } from 'react'
import { createRoute, redirect } from '@tanstack/react-router'
import { ScanBarcode } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { canAccessRoute, getLandingPath } from '@/hooks/useRbac'
import { api, type SearchVariantRow } from '@/lib/api'
import { getStoredSession } from '@/lib/auth'
import { formatCurrency } from '@/lib/formatCurrency'
import { BarcodeScanner } from '@/pos/components/BarcodeScanner'
import { CartPanel } from '@/pos/components/CartPanel'
import { CatalogCategoryNav } from '@/pos/components/CatalogCategoryNav'
import { CatalogGrid } from '@/pos/components/CatalogGrid'
import { QuickKeysBar } from '@/pos/components/QuickKeysBar'
import { SearchBar } from '@/pos/components/SearchBar'
import { useCart } from '@/pos/hooks/useCart'
import { useFavorites } from '@/pos/hooks/useFavorites'
import { useKeyboardWedge } from '@/pos/hooks/useKeyboardWedge'
import { usePosCheckoutSession } from '@/pos/hooks/usePosCheckoutSession'
import { PosLayout } from '@/pos/layout/PosLayout'
import { posCopy } from '@/pos/lib/copy'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'pos',
  beforeLoad: () => {
    const session = getStoredSession()
    if (!session?.user?.role) throw redirect({ to: '/login' } as never)
    if (!canAccessRoute(session.user.role, 'pos')) {
      throw redirect({ to: getLandingPath(session.user.role) as never } as never)
    }
  },
  component: PosRoute,
})

type AddedFeedback = { variantId: string; productName: string } | null

function toCartVariant(variant: SearchVariantRow) {
  return {
    id: variant.id,
    product_id: variant.product_id,
    sku: variant.sku,
    barcode: variant.barcode ?? undefined,
    name: variant.name,
    price: variant.price,
    cost: variant.cost ?? undefined,
    is_active: variant.is_active,
    productName: variant.product_name,
  }
}

export function PosRoute() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [feedback, setFeedback] = useState<AddedFeedback>(null)
  const { items, itemCount, total, addItem, updateQuantity } = useCart()
  const { favorites, recordAdd } = useFavorites()
  const { session, startReview } = usePosCheckoutSession()

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 4500)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const showAdded = useCallback((variantId: string, productName: string) => {
    setFeedback({ variantId, productName })
  }, [])

  const handleVariant = useCallback((variant: SearchVariantRow) => {
    const cartVariant = toCartVariant(variant)
    addItem(cartVariant)
    recordAdd(cartVariant)
    showAdded(variant.id, variant.product_name)
  }, [addItem, recordAdd, showAdded])

  const handleBarcodeScan = useCallback(async (code: string) => {
    const response = await api.searchVariant(code)
    handleVariant(response.data)
  }, [handleVariant])

  useKeyboardWedge({ onScan: handleBarcodeScan })

  const undoLastAdd = () => {
    if (!feedback) return
    const item = items.find((candidate) => candidate.variantId === feedback.variantId)
    if (item) updateQuantity(item.variantId, item.quantity - 1)
    setFeedback(null)
  }

  if (session.stage !== 'selling') return <CartPanel />

  return (
    <PosLayout
      bottomAction={itemCount > 0 ? (
        <Button className="h-16 w-full justify-between rounded-xl px-5 text-lg font-bold" onClick={() => startReview()}>
          <span>{posCopy.viewOrder} · {itemCount}</span>
          <span className="tabular-nums">{formatCurrency(total)}</span>
        </Button>
      ) : null}
    >
      <div className="flex flex-col gap-7">
        <section aria-label={posCopy.sell} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1"><SearchBar onAdded={showAdded} /></div>
            <Button
              variant="outline"
              className="size-14 shrink-0 rounded-xl"
              onClick={() => setScannerOpen(true)}
              aria-label={posCopy.scanCamera}
            >
              <ScanBarcode aria-hidden="true" className="size-6" />
            </Button>
          </div>

          {feedback ? (
            <div role="status" className="flex min-h-14 items-center justify-between gap-3 rounded-xl bg-success-soft px-4 text-success-foreground">
              <p className="min-w-0 truncate text-base font-semibold">{posCopy.added}: {feedback.productName}</p>
              <Button variant="ghost" className="min-h-12 shrink-0 text-base" onClick={undoLastAdd}>{posCopy.undo}</Button>
            </div>
          ) : null}
        </section>

        {favorites.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">{posCopy.frequent}</h2>
            <QuickKeysBar onAdded={showAdded} />
          </section>
        ) : null}

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{posCopy.products}</h2>
          <CatalogCategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
          <CatalogGrid categoryId={selectedCategory} onProductAdded={showAdded} />
        </section>
      </div>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="inset-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-0 p-5 sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border">
          <DialogHeader className="pr-10 text-left">
            <DialogTitle className="text-2xl">{posCopy.scanCamera}</DialogTitle>
            <DialogDescription className="text-base">{posCopy.searchPlaceholder}</DialogDescription>
          </DialogHeader>
          <BarcodeScanner
            onScanSuccess={(variant) => {
              handleVariant(variant)
              setScannerOpen(false)
            }}
            onScanError={() => undefined}
          />
        </DialogContent>
      </Dialog>
    </PosLayout>
  )
}

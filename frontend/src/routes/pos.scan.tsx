/* eslint-disable react-refresh/only-export-components */

import { useCallback, useState } from 'react'
import { ArrowLeft, ScanBarcode, Wand2, XCircle } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { createRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { api, type SearchVariantRow, type Variant } from '@/lib/api'
import { formatCurrency } from '@/lib/formatCurrency'
import { PosLayout } from '@/pos/layout/PosLayout'
import { BarcodeScanner } from '@/pos/components/BarcodeScanner'
import { useKeyboardWedge } from '@/pos/hooks/useKeyboardWedge'
import { Route as posRoute } from './pos'

export const Route = createRoute({
  getParentRoute: () => posRoute,
  path: 'scan',
  component: ScanPage,
})

function ScanPage() {
  const navigate = useNavigate()
  const [scannedVariants, setScannedVariants] = useState<Variant[]>([])
  const [lastError, setLastError] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)
  const latestScan = scannedVariants[scannedVariants.length - 1] ?? null

  const handleVariantSearch = useCallback(async (code: string) => {
    try {
      const response = await api.searchVariant(code)

      if (response.data && response.data.length > 0) {
        const variant = response.data[0]
        setScannedVariants((prev) => [...prev.slice(-4), variant])
        setLastError(null)
        setShowError(false)
        return
      }

      setLastError(`Product not found: ${code}`)
      setShowError(true)

      window.setTimeout(() => {
        setShowError(false)
        setLastError(null)
      }, 2000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Search failed'
      setLastError(errorMsg)
      setShowError(true)

      window.setTimeout(() => {
        setShowError(false)
        setLastError(null)
      }, 2000)
    }
  }, [])

  const handleScanSuccess = useCallback((variant: SearchVariantRow) => {
    setScannedVariants((prev) => [...prev.slice(-4), variant]) // Keep last 5
    setLastError(null)
    setShowError(false)
  }, [])

  const handleScanError = useCallback((_code: string, error: string) => {
    setLastError(error)
    setShowError(true)

    setTimeout(() => {
      setShowError(false)
      setLastError(null)
    }, 2000)
  }, [])

  const { isEnabled: isKeyboardWedgeEnabled, isScanning: isKeyboardScanning, toggle: toggleKeyboardWedge } = useKeyboardWedge({
    onScan: handleVariantSearch,
  })

  return (
    <PosLayout>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.8fr)]">
        <section className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm">
          <div className="border-b border-border/60 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Scan lane
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Keep the cashier moving without leaving the sale.
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                  Use the camera or USB wedge scanner to drop products into the cart as fast as the line moves.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-pill border border-border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-card">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Cashier lane
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Camera
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">Ready to scan</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Wedge
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {isKeyboardWedgeEnabled ? (isKeyboardScanning ? 'Listening now' : 'Armed') : 'Paused'}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Recent hits
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{scannedVariants.length} items</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(17.5rem,0.72fr)]">
            <BarcodeScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />

            <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-muted/25 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Scanner control
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {isKeyboardWedgeEnabled ? 'Keyboard wedge active' : 'Keyboard wedge paused'}
                  </p>
                </div>
                <Button
                  variant={isKeyboardWedgeEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleKeyboardWedge}
                >
                  {isKeyboardWedgeEnabled ? 'Wedge on' : 'Wedge off'}
                </Button>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ScanBarcode className="h-4 w-4 text-muted-foreground" />
                  Quick steps
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  <li>1. Point the camera or wedge at a barcode.</li>
                  <li>2. Confirm the match in recent scans.</li>
                  <li>3. Return to the cart when you’re done.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Wand2 className="h-4 w-4 text-muted-foreground" />
                  Current state
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {isKeyboardWedgeEnabled
                    ? isKeyboardScanning
                      ? 'Listening for the next scan from a connected wedge.'
                      : 'Armed and waiting for the next barcode.'
                    : 'Turn this on only when a USB scanner is plugged in.'}
                </p>
              </div>

              {showError && lastError && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-red-900 dark:border-red-400/20 dark:bg-red-950/60 dark:text-red-100">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-300" />
                  <div>
                    <p className="text-sm font-semibold">Scan problem</p>
                    <p className="text-sm leading-6 text-red-800 dark:text-red-200">{lastError}</p>
                  </div>
                </div>
              )}

              {latestScan && (
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Latest hit
                  </p>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{latestScan.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">SKU: {latestScan.sku}</p>
                    </div>
                    <p className="shrink-0 rounded-pill bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                      {formatCurrency(latestScan.price)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[1.75rem] border border-border/70 bg-card p-4 shadow-sm sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Recent scans
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Added items</h2>
              <span className="rounded-pill border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {scannedVariants.length}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {scannedVariants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background px-4 py-6 text-sm leading-6 text-muted-foreground">
                  Recent matches will appear here as soon as a barcode lands.
                </div>
              ) : (
                scannedVariants.map((variant, index) => (
                  <div
                    key={`${variant.id}-${index}`}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{variant.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">SKU: {variant.sku}</p>
                    </div>
                    <p className="shrink-0 rounded-pill bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                      {formatCurrency(variant.price)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="flex justify-center pb-4">
            <Button variant="outline" onClick={() => navigate({ to: '/pos' })} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to selling floor
            </Button>
          </div>
        </aside>
      </div>
    </PosLayout>
  )
}

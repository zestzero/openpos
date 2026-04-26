import { useEffect, useState } from 'react'
import { Camera, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { createRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, type Variant } from '@/lib/api'
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

  const { isEnabled: isKeyboardWedgeEnabled, lastScan: keyboardScan, isScanning: isKeyboardScanning, toggle: toggleKeyboardWedge } = useKeyboardWedge()

  useEffect(() => {
    if (keyboardScan) {
      handleVariantSearch(keyboardScan)
    }
  }, [keyboardScan])

  const handleVariantSearch = async (code: string) => {
    try {
      const response = await api.searchVariant(code)
      
      if (response.data && response.data.length > 0) {
        // Found variant
        const variant = response.data[0]
        setScannedVariants((prev) => [...prev.slice(-4), variant]) // Keep last 5
        setLastError(null)
      } else {
        // Not found
        setLastError(`Product not found: ${code}`)
        setShowError(true)
        
        // Auto-hide error after 2 seconds
        setTimeout(() => {
          setShowError(false)
          setLastError(null)
        }, 2000)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Search failed'
      setLastError(errorMsg)
      setShowError(true)
      
      // Auto-hide error after 2 seconds
      setTimeout(() => {
        setShowError(false)
        setLastError(null)
      }, 2000)
    }
  }

  const handleScanSuccess = (variant: Variant) => {
    setScannedVariants((prev) => [...prev.slice(-4), variant]) // Keep last 5
    setLastError(null)
  }

  const handleScanError = (_code: string, error: string) => {
    setLastError(error)
    setShowError(true)
    
    setTimeout(() => {
      setShowError(false)
      setLastError(null)
    }, 2000)
  }

  return (
    <PosLayout>
      <div className="flex flex-col gap-4">
        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Secondary entry point
            </p>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Camera className="h-5 w-5" />
              Scan when you need a faster lane
            </CardTitle>
            <CardDescription>
              Use the camera or USB wedge scanner to drop a product into the sale without leaving the POS shell.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
            <div className="rounded-2xl border border-border/70 bg-background p-3 sm:p-4">
              <BarcodeScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/25 p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant={isKeyboardWedgeEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleKeyboardWedge}
                >
                  {isKeyboardWedgeEnabled ? 'Wedge on' : 'Wedge off'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {isKeyboardWedgeEnabled
                    ? isKeyboardScanning
                      ? 'Listening for a scan'
                      : 'Ready for the next barcode'
                    : 'USB scanner is paused'}
                </span>
              </div>

              {!isKeyboardWedgeEnabled ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Turn the wedge on only when a handheld scanner is plugged in.
                </p>
              ) : (
                <div className="rounded-xl border border-border/70 bg-background p-4">
                  <p className="text-sm font-medium text-foreground">Quick steps</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
                    <li>1. Point the camera or wedge at a barcode.</li>
                    <li>2. Confirm the match in the recent scans list.</li>
                    <li>3. Go back to the cart when you are done.</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {scannedVariants.length > 0 && (
          <Card className="border-border/70 bg-card shadow-sm">
            <CardHeader className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Recent scans
              </p>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Added items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scannedVariants.map((variant, index) => (
                  <div
                    key={`${variant.id}-${index}`}
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{variant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {variant.sku}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {new Intl.NumberFormat('th-TH', {
                        style: 'currency',
                        currency: 'THB',
                      }).format(variant.price / 100)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showError && lastError && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-red-500 bg-red-50 p-4 dark:bg-red-950">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="font-medium text-red-800 dark:text-red-200">{lastError}</p>
          </div>
        )}

        <div className="flex justify-center pb-4">
          <Button variant="outline" onClick={() => navigate({ to: '/pos' })}>
            Back to selling floor
          </Button>
        </div>
      </div>
    </PosLayout>
  )
}

import { useEffect, useState } from 'react'
import { Camera, CheckCircle2, Keyboard, XCircle } from 'lucide-react'
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
  
  // Track scanned variants for display
  const [scannedVariants, setScannedVariants] = useState<Variant[]>([])
  const [lastError, setLastError] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)

  // Keyboard wedge scanner
  const { isEnabled: isKeyboardWedgeEnabled, lastScan: keyboardScan, isScanning: isKeyboardScanning, toggle: toggleKeyboardWedge } = useKeyboardWedge()

  // Handle keyboard wedge scans
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
      <div className="flex flex-col gap-6">
        {/* Section 1: Camera Scan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scan with Camera
            </CardTitle>
            <CardDescription>
              Use your device camera to scan product barcodes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
            />
          </CardContent>
        </Card>

        {/* Section 2: Keyboard Wedge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              USB Scanner
            </CardTitle>
            <CardDescription>
              Connect a USB barcode scanner for keyboard-wedge input
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Toggle and Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant={isKeyboardWedgeEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleKeyboardWedge}
                >
                  {isKeyboardWedgeEnabled ? 'Enabled' : 'Disabled'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {isKeyboardWedgeEnabled
                    ? isKeyboardScanning
                      ? 'Listening...'
                      : 'Ready to scan'
                    : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Instructions */}
            {!isKeyboardWedgeEnabled && (
              <p className="text-sm text-muted-foreground">
                Enable keyboard wedge to use USB barcode scanner
              </p>
            )}

            {isKeyboardWedgeEnabled && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">Instructions:</p>
                <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                  <li>Plug in your USB barcode scanner</li>
                  <li>Click in any text field or just scan</li>
                  <li>Scan an item to add it to the cart</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans */}
        {scannedVariants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Recent Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scannedVariants.map((variant, index) => (
                  <div
                    key={`${variant.id}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
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

        {/* Error Display */}
        {showError && lastError && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-950">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="font-medium text-red-800 dark:text-red-200">{lastError}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center pb-4">
          <Button variant="outline" onClick={() => navigate({ to: '/pos' })}>
            Go to Cart
          </Button>
        </div>
      </div>
    </PosLayout>
  )
}

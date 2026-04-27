import { useCallback, useState } from 'react'
import { Camera, CheckCircle2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { api, type Variant } from '@/lib/api'
import { useBarcodeDetector } from '@/pos/hooks/useBarcodeDetector'

interface BarcodeScannerProps {
  onScanSuccess: (variant: Variant) => void
  onScanError: (code: string, error: string) => void
}

export function BarcodeScanner({ onScanSuccess, onScanError }: BarcodeScannerProps) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)

  const handleVariantSearch = useCallback(async (code: string) => {
    setScannedCode(code)
    setSearchLoading(true)
    setStatus('scanning')

    try {
      const response = await api.searchVariant(code)
      
      if (response.data && response.data.length > 0) {
        // Found variant
        const variant = response.data[0]
        setStatus('success')
        onScanSuccess(variant)

        // Auto-restart scanning after 2 seconds
        setTimeout(() => {
          setStatus('idle')
          setScannedCode(null)
        }, 2000)
      } else {
        // Not found
        setStatus('error')
        setErrorMessage(`Product not found: ${code}`)
        onScanError(code, `Product not found: ${code}`)

        // Auto-restart scanning after 2 seconds
        setTimeout(() => {
          setStatus('idle')
          setScannedCode(null)
          setErrorMessage(null)
        }, 2000)
      }
    } catch (err) {
      setStatus('error')
      const errorMsg = err instanceof Error ? err.message : 'Search failed'
      setErrorMessage(errorMsg)
      onScanError(code, errorMsg)

      // Auto-restart scanning after 2 seconds
      setTimeout(() => {
        setStatus('idle')
        setScannedCode(null)
        setErrorMessage(null)
      }, 2000)
    } finally {
      setSearchLoading(false)
    }
  }, [onScanError, onScanSuccess])

  const handleStartScanning = async () => {
    setStatus('scanning')
    await startScanning('barcode-video')
  }

  const handleStopScanning = () => {
    stopScanning()
    setStatus('idle')
  }

  const {
    isSupported,
    isScanning,
    error: scannerError,
    startScanning,
    stopScanning,
  } = useBarcodeDetector({ onScan: handleVariantSearch })

  // Render states
  if (status === 'success' && scannedCode) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-emerald-500/25 bg-emerald-50 px-5 py-8 dark:bg-emerald-950/45">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">Added to cart</p>
          <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-200/80">{scannedCode}</p>
        </div>
      </div>
    )
  }

  if (status === 'error' && errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-red-500/25 bg-red-50 px-5 py-8 dark:bg-red-950/45">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <XCircle className="h-8 w-8 text-red-600 dark:text-red-300" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-red-950 dark:text-red-100">Product not found</p>
          <p className="mt-1 text-sm text-red-800/80 dark:text-red-200/80">{errorMessage}</p>
        </div>
        <p className="text-xs text-red-700/80 dark:text-red-300/80">Scanning will restart automatically.</p>
      </div>
    )
  }

  if (scannerError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-amber-500/25 bg-amber-50 px-5 py-8 dark:bg-amber-950/45">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
          <XCircle className="h-8 w-8 text-amber-600 dark:text-amber-300" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-amber-950 dark:text-amber-100">Camera error</p>
          <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">{scannerError}</p>
        </div>
        <Button onClick={handleStartScanning} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (status === 'scanning' || isScanning) {
    return (
      <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Live camera
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">Searching for a barcode</p>
          </div>
          <span className="rounded-pill border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Active
          </span>
        </div>
        <div className="relative overflow-hidden rounded-[1.25rem] bg-black/5">
          <video
            id="barcode-video"
            className="aspect-video w-full object-cover"
            autoPlay
            playsInline
            muted
          />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-foreground/10" />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {searchLoading ? 'Searching...' : 'Hold steady while the camera locks on.'}
          </p>
          <Button onClick={handleStopScanning} variant="destructive" size="sm">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // Idle state - show start button
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-dashed border-border/70 bg-background px-5 py-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Camera className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-foreground">Scan barcode</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSupported
            ? 'Use the camera for quick item lookup.'
            : 'Camera scanning is unavailable, so the wedge scanner takes over.'}
        </p>
      </div>
      <Button onClick={handleStartScanning} size="lg" className="min-w-40 gap-2">
        <Camera className="mr-2 h-4 w-4" />
        Start Scanning
      </Button>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Camera, CheckCircle2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { api, type Variant } from '@/lib/api'
import { formatTHB } from '@/lib/formatCurrency'
import { useBarcodeDetector } from '@/pos/hooks/useBarcodeDetector'

interface BarcodeScannerProps {
  onScanSuccess: (variant: Variant) => void
  onScanError: (code: string, error: string) => void
}

export function BarcodeScanner({ onScanSuccess, onScanError }: BarcodeScannerProps) {
  const {
    isSupported,
    isScanning,
    lastScan,
    error: scannerError,
    startScanning,
    stopScanning,
  } = useBarcodeDetector()

  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)

  // Handle successful scan
  useEffect(() => {
    if (lastScan && status !== 'success' && status !== 'error') {
      setScannedCode(lastScan)
      handleVariantSearch(lastScan)
    }
  }, [lastScan])

  const handleVariantSearch = async (code: string) => {
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
  }

  const handleStartScanning = async () => {
    setStatus('scanning')
    await startScanning('barcode-video')
  }

  const handleStopScanning = () => {
    stopScanning()
    setStatus('idle')
  }

  // Render states
  if (status === 'success' && scannedCode) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-green-500 bg-green-50 p-6 dark:bg-green-950">
        <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
        <div className="text-center">
          <p className="text-lg font-semibold text-green-800 dark:text-green-200">Added to cart!</p>
          <p className="text-sm text-green-600 dark:text-green-400">{scannedCode}</p>
        </div>
      </div>
    )
  }

  if (status === 'error' && errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-500 bg-red-50 p-6 dark:bg-red-950">
        <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
        <div className="text-center">
          <p className="text-lg font-semibold text-red-800 dark:text-red-200">Product not found</p>
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        </div>
        <p className="text-xs text-red-500 dark:text-red-400">Scanning will restart automatically...</p>
      </div>
    )
  }

  if (scannerError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-yellow-500 bg-yellow-50 p-6 dark:bg-yellow-950">
        <XCircle className="h-16 w-16 text-yellow-600 dark:text-yellow-400" />
        <div className="text-center">
          <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Camera Error</p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">{scannerError}</p>
        </div>
        <Button onClick={handleStartScanning} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (status === 'scanning' || isScanning) {
    return (
      <div className="flex flex-col gap-4">
        <video
          id="barcode-video"
          className="w-full rounded-lg object-cover aspect-video"
          autoPlay
          playsInline
          muted
        />
        <div className="flex justify-center">
          <Button onClick={handleStopScanning} variant="destructive" size="lg">
            Cancel
          </Button>
        </div>
        {searchLoading && (
          <p className="text-center text-sm text-muted-foreground">Searching...</p>
        )}
      </div>
    )
  }

  // Idle state - show start button
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border p-6">
      <Camera className="h-16 w-16 text-muted-foreground" />
      <div className="text-center">
        <p className="text-lg font-medium">Scan Barcode</p>
        <p className="text-sm text-muted-foreground">
          {isSupported
            ? 'Use your camera to scan product barcodes'
            : 'Camera scanning not available, using fallback scanner'}
        </p>
      </div>
      <Button onClick={handleStartScanning} size="lg" className="min-w-40">
        <Camera className="mr-2 h-4 w-4" />
        Start Scanning
      </Button>
    </div>
  )
}
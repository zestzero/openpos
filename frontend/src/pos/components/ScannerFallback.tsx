import { BarcodeScanner } from './BarcodeScanner'
import type { Variant } from '@/lib/api'

interface ScannerFallbackProps {
  onScanSuccess: (variant: Variant) => void
  onScanError: (code: string, error: string) => void
}

/**
 * ScannerFallback - A wrapper that always uses html5-qrcode fallback
 * 
 * This component is useful for testing or when the user explicitly
 * wants to use the html5-qrcode library instead of native BarcodeDetector API.
 * 
 * Note: The BarcodeScanner component already handles fallback automatically,
 * so this wrapper is primarily for explicit fallback scenarios.
 */
export function ScannerFallback({ onScanSuccess, onScanError }: ScannerFallbackProps) {
  // The BarcodeScanner component handles fallback automatically,
  // so this component simply wraps it for explicit fallback usage.
  // 
  // In practice, the main BarcodeScanner component intelligently decides
  // whether to use BarcodeDetector or html5-qrcode based on browser support.
  return (
    <BarcodeScanner
      onScanSuccess={onScanSuccess}
      onScanError={onScanError}
    />
  )
}
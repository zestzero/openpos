import { useCallback, useRef, useState } from 'react'

export interface UseBarcodeDetectorReturn {
  isSupported: boolean
  isScanning: boolean
  lastScan: string | null
  error: string | null
  startScanning: (videoElementId: string) => Promise<void>
  stopScanning: () => void
}

// BarcodeDetector formats to support
const BARCODE_FORMATS = [
  'ean_13',
  'ean_8',
  'code_128',
  'code_39',
  'upc_a',
  'upc_e',
  'qr_code',
] as const

// HTML5-QRCode configuration
const HTML5_QRCODE_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  formatsToSupport: BARCODE_FORMATS,
}

export function useBarcodeDetector(): UseBarcodeDetectorReturn {
  const [isSupported] = useState(() => {
    return 'BarcodeDetector' in window
  })

  const [isScanning, setIsScanning] = useState(false)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const detectorRef = useRef<InstanceType<typeof BarcodeDetector> | null>(null)
  const html5QrcodeScannerRef = useRef<unknown | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isHtml5FallbackRef = useRef(false)
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopScanning = useCallback(() => {
    // Clear any pending scan timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }

    // Stop animation frame loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Stop HTML5-QRCode scanner if active
    if (isHtml5FallbackRef.current && html5QrcodeScannerRef.current) {
      // TypeScript doesn't know the Html5QrcodeScanner type, so we use a dynamic call
      const scanner = html5QrcodeScannerRef.current as {
        clear?: () => Promise<void>
      }
      if (scanner.clear) {
        scanner.clear().catch(console.error)
      }
      html5QrcodeScannerRef.current = null
      isHtml5FallbackRef.current = false
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    videoRef.current = null
    detectorRef.current = null

    setIsScanning(false)
  }, [])

  const detectBarcodes = useCallback(
    async (video: HTMLVideoElement, detector: BarcodeDetector) => {
      if (!video.videoWidth || !video.videoHeight) {
        animationFrameRef.current = requestAnimationFrame(() => detectBarcodes(video, detector))
        return
      }

      try {
        const barcodes = await detector.detect(video)
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue
          setLastScan(code)

          // Prevent duplicate reads: stop scanning for 500ms after detection
          scanTimeoutRef.current = setTimeout(() => {
            // After the delay, restart scanning for next barcode
          }, 500)

          return
        }
      } catch (err) {
        // Detection error - continue scanning
        console.warn('Barcode detection error:', err)
      }

      animationFrameRef.current = requestAnimationFrame(() => detectBarcodes(video, detector))
    },
    []
  )

  const startScanning = useCallback(
    async (videoElementId: string) => {
      setError(null)
      setLastScan(null)

      const videoElement = document.getElementById(videoElementId) as HTMLVideoElement | null

      if (!videoElement) {
        setError(`Video element with id "${videoElementId}" not found`)
        return
      }

      try {
        // Check if BarcodeDetector is available
        if (isSupported && 'BarcodeDetector' in window) {
          // Use native BarcodeDetector API
          const BarcodeDetectorClass = window.BarcodeDetector as {
            new (options: { formats: readonly string[] }): BarcodeDetector
          }
          detectorRef.current = new BarcodeDetectorClass({
            formats: BARCODE_FORMATS,
          })

          // Get camera stream
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment', // Rear camera on mobile
            },
          })

          streamRef.current = stream
          videoRef.current = videoElement
          videoElement.srcObject = stream

          await videoElement.play()

          setIsScanning(true)

          // Start detection loop
          if (detectorRef.current) {
            detectBarcodes(videoElement, detectorRef.current)
          }
        } else {
          // Fallback to html5-qrcode
          await startHtml5QrcodeScanner(videoElementId)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        
        if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
          setError('Camera permission denied. Please allow camera access to scan barcodes.')
        } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('not found')) {
          setError('No camera found. Please connect a camera and try again.')
        } else {
          // Try html5-qrcode fallback
          try {
            await startHtml5QrcodeScanner(videoElementId)
          } catch (fallbackErr) {
            setError(`Failed to start scanner: ${errorMessage}`)
          }
        }
      }
    },
    [isSupported, detectBarcodes]
  )

  const startHtml5QrcodeScanner = async (videoElementId: string) => {
    // Dynamically import html5-qrcode
    const { Html5QrcodeScanner } = await import('html5-qrcode')

    isHtml5FallbackRef.current = true

    const scanner = new Html5QrcodeScanner(videoElementId, HTML5_QRCODE_CONFIG, /* verbose= */ false)

    html5QrcodeScannerRef.current = scanner

    scanner.render(
      (decodedText: string) => {
        // Successful scan
        setLastScan(decodedText)
      },
      (errorMessage: string) => {
        // Scan error - ignore, this happens frequently during scanning
        console.debug('HTML5-QRCode scan error:', errorMessage)
      }
    )

    setIsScanning(true)
  }

  return {
    isSupported,
    isScanning,
    lastScan,
    error,
    startScanning,
    stopScanning,
  }
}
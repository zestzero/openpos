import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseKeyboardWedgeReturn {
  isEnabled: boolean
  lastScan: string | null
  isScanning: boolean
  toggle: () => void
}

interface UseKeyboardWedgeOptions {
  onScan?: (code: string) => void
}

// Maximum time between keystrokes to consider as scanner input (ms)
const SCANNER_KEY_INTERVAL_MS = 50

// Minimum barcode length to accept
const MIN_BARCODE_LENGTH = 4

// Timeout after Enter to consider scan complete (ms)
const SCAN_COMPLETE_TIMEOUT_MS = 100

export function useKeyboardWedge(options: UseKeyboardWedgeOptions = {}): UseKeyboardWedgeReturn {
  const { onScan } = options
  const [isEnabled, setIsEnabled] = useState(true)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  // Refs for mutable state to avoid closure issues
  const bufferRef = useRef<string>('')
  const lastKeystrokeRef = useRef<number>(0)
  const scanCompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInInputRef = useRef(false)

  const toggle = useCallback(() => {
    setIsEnabled((prev) => !prev)
    // Clear buffer when toggling
    if (!isEnabled) {
      bufferRef.current = ''
      setLastScan(null)
    }
  }, [isEnabled])

  // Handle keydown events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only process if enabled
    if (!isEnabled) return

    // Check if target is an input or textarea - don't interfere with typing
    const target = event.target as HTMLElement
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable

    if (isInput) {
      isInInputRef.current = true
      return
    }

    isInInputRef.current = false

    // Ignore modifier keys
    if (
      event.key === 'Shift' ||
      event.key === 'Control' ||
      event.key === 'Alt' ||
      event.key === 'Meta' ||
      event.key === 'CapsLock' ||
      event.key === 'Tab' ||
      event.key === 'Escape'
    ) {
      return
    }

    const now = Date.now()
    const timeSinceLastKeystroke = now - lastKeystrokeRef.current

    // Clear any pending scan complete timeout
    if (scanCompleteTimeoutRef.current) {
      clearTimeout(scanCompleteTimeoutRef.current)
      scanCompleteTimeoutRef.current = null
    }

    if (event.key === 'Enter') {
      // Enter pressed - check if we have a valid barcode
      const code = bufferRef.current.trim()

      if (code.length >= MIN_BARCODE_LENGTH) {
        setLastScan(code)
        setIsScanning(false)
        onScan?.(code)
        // Clear buffer after successful scan
        bufferRef.current = ''
      } else {
        // Short code - ignore
        bufferRef.current = ''
      }

      return
    }

    // Check if this is a rapid keystroke (scanner input)
    if (timeSinceLastKeystroke < SCANNER_KEY_INTERVAL_MS) {
      // Append character to buffer
      bufferRef.current += event.key
      setIsScanning(true)
    } else {
      // Too slow - start new buffer
      bufferRef.current = event.key
    }

    lastKeystrokeRef.current = now

    // Set timeout to clear buffer if scan seems incomplete
    scanCompleteTimeoutRef.current = setTimeout(() => {
      // If no Enter was pressed within timeout, consider scan incomplete
      bufferRef.current = ''
      setIsScanning(false)
    }, SCAN_COMPLETE_TIMEOUT_MS)
  }, [isEnabled, onScan])

  // Set up event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      
      // Clean up timeout
      if (scanCompleteTimeoutRef.current) {
        clearTimeout(scanCompleteTimeoutRef.current)
      }
    }
  }, [handleKeyDown])

  return {
    isEnabled,
    lastScan,
    isScanning,
    toggle,
  }
}

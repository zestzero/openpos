import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  useBarcodeDetector: vi.fn(),
  onScanSuccess: vi.fn(),
  onScanError: vi.fn(),
}))

vi.mock('@/pos/hooks/useBarcodeDetector', () => ({
  useBarcodeDetector: mocks.useBarcodeDetector,
}))

import { BarcodeScanner } from '../BarcodeScanner'

describe('BarcodeScanner', () => {
  beforeEach(() => {
    mocks.onScanSuccess.mockReset()
    mocks.onScanError.mockReset()
    mocks.useBarcodeDetector.mockReturnValue({
      isSupported: true,
      isScanning: true,
      lastScan: null,
      error: null,
      startScanning: vi.fn(),
      stopScanning: vi.fn(),
    })
  })

  it('renders a video target when native camera barcode detection is supported', () => {
    const { container } = render(
      <BarcodeScanner onScanSuccess={mocks.onScanSuccess} onScanError={mocks.onScanError} />
    )

    const target = container.querySelector('#barcode-video')
    expect(target).not.toBeNull()
    expect(target?.tagName).toBe('VIDEO')
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('renders a div target for the html5-qrcode fallback path', () => {
    mocks.useBarcodeDetector.mockReturnValue({
      isSupported: false,
      isScanning: true,
      lastScan: null,
      error: null,
      startScanning: vi.fn(),
      stopScanning: vi.fn(),
    })

    const { container } = render(
      <BarcodeScanner onScanSuccess={mocks.onScanSuccess} onScanError={mocks.onScanError} />
    )

    const target = container.querySelector('#barcode-video')
    expect(target).not.toBeNull()
    expect(target?.tagName).toBe('DIV')
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('starts scanning using the shared scanner target id', () => {
    const startScanning = vi.fn().mockResolvedValue(undefined)
    mocks.useBarcodeDetector.mockReturnValue({
      isSupported: false,
      isScanning: false,
      lastScan: null,
      error: null,
      startScanning,
      stopScanning: vi.fn(),
    })

    render(<BarcodeScanner onScanSuccess={mocks.onScanSuccess} onScanError={mocks.onScanError} />)
    fireEvent.click(screen.getByRole('button', { name: /start scanning/i }))

    expect(startScanning).toHaveBeenCalledWith('barcode-video')
  })
})

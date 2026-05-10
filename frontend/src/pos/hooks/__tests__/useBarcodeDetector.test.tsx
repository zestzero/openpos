import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  render: vi.fn(),
  clear: vi.fn().mockResolvedValue(undefined),
  ctor: vi.fn(),
}))

vi.mock('html5-qrcode', () => {
  class Html5QrcodeScannerMock {
    constructor(...args: unknown[]) {
      mocks.ctor(...args)
    }

    render = mocks.render
    clear = mocks.clear
  }

  return {
    Html5QrcodeSupportedFormats: {
      EAN_13: 'EAN_13',
      EAN_8: 'EAN_8',
      CODE_128: 'CODE_128',
      CODE_39: 'CODE_39',
      UPC_A: 'UPC_A',
      UPC_E: 'UPC_E',
      QR_CODE: 'QR_CODE',
    },
    Html5QrcodeScanner: Html5QrcodeScannerMock,
  }
})

import { useBarcodeDetector } from '../useBarcodeDetector'

function HookHarness() {
  const { startScanning } = useBarcodeDetector()

  return (
    <div>
      <div id="barcode-target" />
      <button type="button" onClick={() => void startScanning('barcode-target')}>
        Start scanner
      </button>
    </div>
  )
}

describe('useBarcodeDetector', () => {
  beforeEach(() => {
    mocks.render.mockClear()
    mocks.clear.mockClear()
    mocks.ctor.mockClear()
  })

  it('falls back to html5-qrcode when native BarcodeDetector is unavailable', async () => {
    render(<HookHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Start scanner' }))

    await waitFor(() => {
      expect(mocks.ctor.mock.calls.length).toBeGreaterThan(0)
    })

    expect(mocks.ctor).toHaveBeenCalledWith(
      'barcode-target',
      expect.objectContaining({
        fps: 10,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: expect.arrayContaining(['EAN_13', 'CODE_128', 'QR_CODE']),
      }),
      false
    )
    expect(mocks.render).toHaveBeenCalledTimes(1)
    expect(mocks.render).toHaveBeenCalledWith(expect.any(Function), expect.any(Function))
  })
})

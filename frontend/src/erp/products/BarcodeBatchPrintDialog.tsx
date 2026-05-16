import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import QRCode from 'qrcode'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import type { BarcodeLabel } from './barcodeLabels'

type BarcodeBatchPrintDialogProps = {
  open: boolean
  labels: BarcodeLabel[]
  onOpenChange: (open: boolean) => void
  onClearSelection: () => void
}

type LabelMachineFormat = 'barcode' | 'qr'

export function BarcodeBatchPrintDialog({ open, labels, onOpenChange, onClearSelection }: BarcodeBatchPrintDialogProps) {
  const canPrint = labels.length > 0
  const [format, setFormat] = useState<LabelMachineFormat>('barcode')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,820px)] w-[calc(100vw-2rem)] max-w-5xl overflow-hidden p-0 print:fixed print:inset-0 print:max-h-none print:w-full print:max-w-none print:translate-x-0 print:translate-y-0 print:overflow-visible print:border-0 print:shadow-none">
        <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-border px-6 py-5 text-left print:hidden">
            <DialogTitle>Label preview</DialogTitle>
            <DialogDescription>
              {labels.length} label{labels.length !== 1 ? 's' : ''} selected. Choose Barcode or QR code for the print sheet.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-3 print:hidden">
            <p className="text-sm font-medium text-foreground">Machine-readable format</p>
            <div className="inline-flex rounded-lg border border-border bg-background p-1">
              <Button
                type="button"
                size="sm"
                variant={format === 'barcode' ? 'default' : 'ghost'}
                onClick={() => setFormat('barcode')}
              >
                Barcode
              </Button>
              <Button
                type="button"
                size="sm"
                variant={format === 'qr' ? 'default' : 'ghost'}
                onClick={() => setFormat('qr')}
              >
                QR code
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-6 print:overflow-visible print:bg-background print:p-0">
            {canPrint ? (
              <div data-barcode-print-sheet className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-0" aria-label="Printable barcode labels">
                {labels.map((label) => (
                  <article key={label.id} className="break-inside-avoid rounded-card border border-border bg-background p-4 shadow-sm print:h-[38mm] print:rounded-none print:border print:p-[4mm] print:shadow-none">
                    <div className="min-w-0 space-y-2">
                      <div>
                        <p className="truncate text-sm font-semibold text-foreground" title={`${label.productName} · ${label.variantName}`}>{label.productName}</p>
                        <p className="truncate text-xs text-muted-foreground" title={label.variantName}>{label.variantName}</p>
                      </div>
                      {format === 'barcode' ? <MachineBarcode value={label.payload} /> : <QrCodeImage value={label.payload} />}
                      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                        <span className="min-w-0 truncate">SKU {label.sku}</span>
                        <span className="shrink-0 font-medium text-foreground">{label.price}</span>
                      </div>
                      <p className="truncate font-mono text-[10px] tracking-[0.12em] text-foreground" title={label.humanReadable}>{label.humanReadable}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-card border border-dashed border-border bg-background px-6 py-12 text-center">
                <p className="text-sm font-medium text-foreground">No barcode labels selected</p>
                <p className="mt-2 text-sm text-muted-foreground">Select Products or Variants before opening print preview.</p>
              </div>
            )}
          </div>

          <style>{`@media print { @page { size: A4; margin: 8mm; } body * { visibility: hidden; } [data-barcode-print-sheet], [data-barcode-print-sheet] * { visibility: visible; } [data-barcode-print-sheet] { position: fixed; inset: 0; } }`}</style>

          <DialogFooter className="border-t border-border px-6 py-4 print:hidden">
            <Button type="button" variant="outline" onClick={onClearSelection} disabled={!canPrint}>Clear selection</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Adjust selection</Button>
            <Button type="button" className="gap-2" onClick={() => window.print()} disabled={!canPrint}>
              <Printer className="h-4 w-4" />
              Print labels
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function QrCodeImage({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setDataUrl(null)
    setError(null)

    void QRCode.toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 6,
      type: 'image/png',
    })
      .then((nextDataUrl) => {
        if (active) {
          setDataUrl(nextDataUrl)
        }
      })
      .catch(() => {
        if (active) {
          setError('QR code unavailable')
        }
      })

    return () => {
      active = false
    }
  }, [value])

  if (error) {
    return (
      <div className="flex h-20 items-center justify-center rounded-sm border border-dashed border-destructive/40 bg-destructive/5 px-3 text-center text-xs font-medium text-destructive">
        {error}
      </div>
    )
  }

  if (!dataUrl) {
    return (
      <div className="flex h-20 items-center justify-center rounded-sm border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
        Rendering QR…
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <img src={dataUrl} alt={`QR code for ${value}`} className="h-20 w-20 object-contain print:h-[20mm] print:w-[20mm]" />
    </div>
  )
}

function MachineBarcode({ value }: { value: string }) {
  const encoded = code39Encode(value || 'OPENPOS')

  return (
    <div className="flex h-12 items-stretch justify-center overflow-hidden rounded-sm bg-background py-1" aria-label={`Machine-readable Code 39 barcode ${value}`}>
      {encoded.map((bar, index) => (
        <span key={`${value}-${index}`} className={`block h-full ${bar.black ? 'bg-foreground' : 'bg-transparent'}`} style={{ width: `${bar.wide ? 3 : 1}px` }} />
      ))}
    </div>
  )
}

const code39Patterns: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn',
  F: 'nnwnwwnnn', G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn',
  K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww', O: 'wnnnwnnwn',
  P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn', S: 'nnwnnnwwn', T: 'nnnnwnwwn',
  U: 'wwnnnnnnw', V: 'nwwnnnnnw', W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn', '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn',
}

function code39Encode(value: string) {
  const sanitized = `*${value.toUpperCase().replace(/[^0-9A-Z ./$+%-]/g, '-')}*`
  const bars: { black: boolean; wide: boolean }[] = []

  for (const char of sanitized) {
    const pattern = code39Patterns[char] ?? code39Patterns['-']
    Array.from(pattern).forEach((width, index) => {
      bars.push({ black: index % 2 === 0, wide: width === 'w' })
    })
    bars.push({ black: false, wide: false })
  }

  return bars
}

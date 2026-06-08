# QR Label Printing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a print-preview option that lets ERP owners print selected Variant labels as either barcodes or QR codes using the same payload.

**Architecture:** Keep Product page selection unchanged and make the machine-readable format a local preview concern inside `BarcodeBatchPrintDialog`. Generate QR image data URLs from `BarcodeLabel.payload` with the existing `qrcode` dependency, while preserving the existing printable grid and print isolation.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, existing `qrcode` package.

---

## File structure

- Modify `frontend/src/erp/products/BarcodeBatchPrintDialog.tsx`: add a `LabelMachineFormat` state, segmented format control, QR rendering component, and generic label copy.
- Modify `frontend/src/erp/__tests__/erp-management.test.tsx`: mock `qrcode`, render the dialog directly, and test barcode/QR switching.
- Modify `frontend/src/erp/products/__tests__/barcodeLabels.test.ts`: add an assertion that QR uses the same `payload` contract from `buildBarcodeLabels`.
- No backend changes. No changes to POS scanner lookup.

---

### Task 1: Add a failing QR format test

**Files:**
- Modify: `frontend/src/erp/__tests__/erp-management.test.tsx`

- [ ] **Step 1: Import the dialog and mock QR generation**

At the top of `frontend/src/erp/__tests__/erp-management.test.tsx`, add this import after the existing product imports:

```ts
import { BarcodeBatchPrintDialog } from '../products/BarcodeBatchPrintDialog'
```

Add this mock near the imports:

```ts
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(async (payload: string) => `data:image/png;base64,qr-${payload}`),
  },
}))
```

- [ ] **Step 2: Add a test for switching from barcode to QR**

Append this test inside `describe('ERP catalog management', () => { ... })`:

```tsx
  it('switches batch label preview from barcode to QR while keeping the same payload', async () => {
    render(
      <BarcodeBatchPrintDialog
        open
        labels={[
          {
            id: 'var-1',
            productName: 'Jasmine Tea',
            variantName: 'Large',
            sku: 'TEA-001',
            price: '฿129.00',
            payload: '1234567890123',
            humanReadable: '1234567890123',
          },
        ]}
        onOpenChange={() => undefined}
        onClearSelection={() => undefined}
      />,
    )

    expect(screen.getByText('Label preview')).toBeInTheDocument()
    expect(screen.getByLabelText('Machine-readable Code 39 barcode 1234567890123')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'QR code' }))

    expect(await screen.findByAltText('QR code for 1234567890123')).toHaveAttribute('src', 'data:image/png;base64,qr-1234567890123')
    expect(screen.queryByLabelText('Machine-readable Code 39 barcode 1234567890123')).not.toBeInTheDocument()
  })
```

- [ ] **Step 3: Run the test and verify it fails**

Run:

```bash
npm run test -- --run src/erp/__tests__/erp-management.test.tsx
```

Expected: FAIL because `BarcodeBatchPrintDialog` still renders `Barcode label preview`, has no `QR code` button, and has no QR image.

---

### Task 2: Implement preview-level format state and control

**Files:**
- Modify: `frontend/src/erp/products/BarcodeBatchPrintDialog.tsx`

- [ ] **Step 1: Add React state and QRCode import**

Replace the first imports with:

```ts
import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import QRCode from 'qrcode'
```

Add this type below the props type:

```ts
type LabelMachineFormat = 'barcode' | 'qr'
```

Inside `BarcodeBatchPrintDialog`, after `const canPrint = labels.length > 0`, add:

```ts
  const [format, setFormat] = useState<LabelMachineFormat>('barcode')
```

- [ ] **Step 2: Rename preview copy and add segmented control**

Change the dialog title from:

```tsx
<DialogTitle>Barcode label preview</DialogTitle>
```

to:

```tsx
<DialogTitle>Label preview</DialogTitle>
```

Change the description to:

```tsx
<DialogDescription>
  {labels.length} label{labels.length !== 1 ? 's' : ''} selected. Choose Barcode or QR code for the print sheet.
</DialogDescription>
```

Immediately after `</DialogHeader>`, add:

```tsx
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
```

- [ ] **Step 3: Render the selected machine-readable component**

Replace:

```tsx
<MachineBarcode value={label.payload} />
```

with:

```tsx
{format === 'barcode' ? <MachineBarcode value={label.payload} /> : <QrCodeImage value={label.payload} />}
```

- [ ] **Step 4: Add QR rendering component**

Add this component above `MachineBarcode`:

```tsx
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
```

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

```bash
npm run test -- --run src/erp/__tests__/erp-management.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the UI implementation**

Run:

```bash
git add frontend/src/erp/products/BarcodeBatchPrintDialog.tsx frontend/src/erp/__tests__/erp-management.test.tsx
git commit -m "add QR label preview option"
```

---

### Task 3: Strengthen payload contract test

**Files:**
- Modify: `frontend/src/erp/products/__tests__/barcodeLabels.test.ts`

- [ ] **Step 1: Add explicit QR payload contract assertion**

In `builds deterministic labels and reuses saved barcode payloads`, after the existing `expect(labels[1].sku).toBe('No SKU')`, add:

```ts
    const qrPayloads = labels.map((label) => label.payload)
    expect(qrPayloads).toEqual(['8850000000012', 'ERP-JASMINE-TEA-WITH-A-VERY-LONG-PRODUCT-NAME-NO-BARCODE-VARIANT'])
```

- [ ] **Step 2: Run helper tests**

Run:

```bash
npm run test -- --run src/erp/products/__tests__/barcodeLabels.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit the test hardening**

Run:

```bash
git add frontend/src/erp/products/__tests__/barcodeLabels.test.ts
git commit -m "test QR label payload contract"
```

---

### Task 4: Final validation

**Files:**
- No new files.

- [ ] **Step 1: Run targeted frontend tests**

Run:

```bash
npm run test -- --run src/erp/__tests__/erp-management.test.tsx src/erp/products/__tests__/barcodeLabels.test.ts
```

Expected: both test files pass.

- [ ] **Step 2: Run frontend build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build pass. Existing large chunk warnings are acceptable if unchanged.

- [ ] **Step 3: Run status check**

Run:

```bash
git status --short --branch
```

Expected: branch is ahead with no uncommitted implementation changes.

---

## Self-review

- Spec coverage: preview-level format toggle, same payload, QR rendering, print isolation, empty selection, and tests are covered by Tasks 1-4.
- Placeholder scan: no placeholders or ambiguous implementation steps remain.
- Type consistency: `LabelMachineFormat`, `QrCodeImage`, and `BarcodeLabel.payload` names match across tasks.

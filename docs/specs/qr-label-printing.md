# QR Label Printing Design

## Context

OpenPOS now supports ERP Product page batch label printing for selected active Variants. The existing print preview renders Code 39-style barcode labels from a deterministic payload: a saved `variant.barcode` when present, otherwise the generated `ERP-...` fallback used by the import flow.

Users also need the option to print QR labels. QR labels must encode the same payload as barcode labels so POS scanner lookup behavior stays aligned and no backend or scanner parsing changes are required.

## Goal

Add a print-preview format option that lets owners print selected Variant labels as either barcodes or QR codes.

## Non-goals

- Do not change the payload model.
- Do not store generated QR data in the backend.
- Do not add per-Variant format choices.
- Do not update POS scanner lookup behavior.

## Recommended approach

Use a preview-level segmented control with two options:

- `Barcode`
- `QR code`

The selected format applies to the whole print sheet. This keeps the batch workflow simple and avoids crowded labels.

## User flow

1. Owner selects Products or individual active Variants from the Product page.
2. Owner opens label preview.
3. Preview shows the selected label count and a machine-readable format control.
4. Owner chooses `Barcode` or `QR code`.
5. Labels update in place while preserving selection.
6. Owner prints through the existing browser print action.

## Component design

### `BarcodeBatchPrintDialog`

Rename UI copy to generic label language:

- Dialog title: `Label preview`
- Print button: `Print labels`

Add local state:

```ts
type LabelMachineFormat = 'barcode' | 'qr'
```

Render a small segmented control in the dialog header or action area. The control must be hidden during print.

### QR rendering

Reuse the existing `qrcode` dependency already used by PromptPay. Generate QR data URLs client-side from `label.payload`.

Implementation options:

- Small helper hook/component inside the print dialog for async QR generation.
- Or a focused `QrCodeImage` component under `frontend/src/erp/products/`.

The QR component should show a bounded square placeholder while rendering and an accessible alt label such as `QR code for <payload>`.

### Payload

QR code value is exactly `BarcodeLabel.payload`.

No JSON wrapper, no Variant ID, and no extra metadata.

## Layout and print behavior

- Keep the existing label grid, page margins, and print isolation.
- Barcode labels keep their current wide horizontal machine-readable area.
- QR labels use a centered square image with the same product name, variant name, SKU, price, and human-readable payload text.
- Long product and Variant names remain truncated in preview and print.
- Empty selection remains blocked from printing.

## Error handling and hardening

- If QR generation fails, show a compact error state inside that label instead of breaking the whole preview.
- The print button remains enabled as long as there are printable labels; failed QR labels are visible before printing.
- Archived Variants remain excluded because label generation already filters inactive Variants.

## Tests

Add or update frontend tests to cover:

- The preview can switch from barcode mode to QR mode.
- QR mode uses the same `payload` produced by `buildBarcodeLabels`.
- Empty selection still blocks printing.
- Existing barcode label helper tests continue to pass.

## Acceptance criteria

- Owner can choose Barcode or QR code in the batch label preview.
- QR code encodes the same payload as the barcode for the selected Variant.
- Print output only includes labels, not dialog controls.
- Selection state is unchanged when switching formats.
- Tests and frontend build pass.

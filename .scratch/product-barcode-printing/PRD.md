# Product barcode batch printing

## Goal
Add a product-page workflow that lets a user multi-select products and/or variants and generate printable barcodes for the selected items.

## Problem
Right now the product page supports product and variant management, but there is no batch flow for selecting multiple catalog items and generating print-ready barcodes.

## User outcome
A shop owner or staff member can:
- select multiple products and/or variants from the product page
- review the selected items in a batch panel or preview
- generate a printable barcode sheet/labels
- print from the browser with a predictable layout

## Assumptions
- Variants are the primary printable unit, but product-level selection may expand to all active variants under that product.
- Barcode labels should include human-readable text as well as a machine-readable barcode.
- Printing can start with browser print support; a dedicated PDF export is optional unless needed later.

## Non-goals
- Inventory changes or stock adjustments
- Scan-to-add workflows
- External label-printer integration
- Packaging/shipping barcode formats unless explicitly needed later

## Proposed UX
1. Add multi-select controls to the product list and variant rows.
2. Add a batch action such as **Create barcodes**.
3. Open a selection summary or preview drawer/modal.
4. Render printable barcode labels for the selected items.
5. Use browser print styling to produce a clean page.

## Acceptance criteria
- User can select more than one product and/or variant from the product page.
- Product selection can expand to one or more printable variant rows, or the UX clearly explains the selected scope.
- A batch barcode preview exists before printing.
- Printed output includes at least SKU/name plus a scannable barcode per label.
- Empty selection is blocked with a helpful message.
- Duplicate selection does not create duplicate labels unless intentionally allowed.

## Candidate implementation areas
- `frontend/src/erp/products/ProductManagementPage.tsx`
- `frontend/src/erp/tables/ProductTable.tsx`
- `frontend/src/erp/products/ProductDrawer.tsx`
- new barcode preview/print components under `frontend/src/erp/products/` or `frontend/src/shared/`

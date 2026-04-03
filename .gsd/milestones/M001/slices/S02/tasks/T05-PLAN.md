# T05: 02-pos-frontend-offline 04

**Slice:** S02 — **Milestone:** M001

## Description

Build the cart system and barcode scanning: Zustand cart store, bottom-sheet cart UI, camera barcode scanner, and USB keyboard-wedge detection.

Purpose: This is the core POS interaction — adding items to cart (POS-05), scanning barcodes (POS-01, POS-02), and seeing the running total (POS-07). Per D-01, the cart is a bottom-sheet that slides up; per D-04, a collapsed summary bar shows count + total.

Output: Complete cart management with tap-to-add, camera scan, wedge scan, quantity adjustment, and THB-formatted totals.

## Must-Haves

- [ ] "Cashier can add items to cart by tapping product tiles"
- [ ] "Cashier can scan barcode via device camera to add items"
- [ ] "Cashier can scan barcode via USB keyboard-wedge to add items"
- [ ] "Cashier can adjust quantities and remove items in cart"
- [ ] "Cart shows running total, item count, and line subtotals in THB"
- [ ] "Toast appears when barcode is not found"

## Files

- `frontend/src/stores/cart-store.ts`
- `frontend/src/components/pos/cart-bottom-sheet.tsx`
- `frontend/src/components/pos/cart-item-row.tsx`
- `frontend/src/components/pos/cart-summary-bar.tsx`
- `frontend/src/components/pos/barcode-scanner.tsx`
- `frontend/src/hooks/use-barcode-scanner.ts`
- `frontend/src/hooks/use-keyboard-wedge.ts`
- `frontend/src/routes/pos/index.tsx`
- `frontend/package.json`

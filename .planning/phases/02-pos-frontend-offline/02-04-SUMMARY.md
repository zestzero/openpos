---
phase: 02-pos-frontend-offline
plan: "04"
subsystem: ui
tags: [zustand, barcode, barcode-detector, html5-qrcode, keyboard-wedge, cart, shadcn, pos]

# Dependency graph
requires:
  - phase: "02-pos-frontend-offline/02-02"
    provides: "API client with fetchProducts/search, VariantResponse type, formatTHB, AuthProvider"
  - phase: "02-pos-frontend-offline/02-03"
    provides: "Dexie.js offline DB, sync queue, PWA service worker"
provides:
  - "Zustand cart store with add/remove/update/clear and running totals"
  - "Bottom-sheet cart UI with quantity controls, empty state, and THB total"
  - "Collapsed cart summary bar (fixed bottom, item count badge, total)"
  - "Camera barcode scanning via BarcodeDetector + html5-qrcode fallback"
  - "USB keyboard-wedge scanner detection at <50ms threshold"
  - "Toast notification for barcode-not-found"
affects:
  - "02-pos-frontend-offline (Plan 05: favorites + offline sale completion — uses cart store, adds to cart)"
  - "03-payments-receipts (Plan 01: payment type selection, completes cart checkout)"

# Tech tracking
tech-stack:
  added:
    - html5-qrcode ^2.3.8
  patterns:
    - "Zustand store with inline derived selectors (getItemCount, getTotalCents)"
    - "BarcodeDetector API (Chrome/Android native) with dynamic import fallback to html5-qrcode"
    - "USB wedge scanner: rapid keystroke detection (<50ms), Enter terminator, auto-reset 200ms"
    - "Sonner toast.error() for barcode-not-found UX per D-07"

key-files:
  created:
    - "frontend/src/stores/cart-store.ts — Zustand CartState with CartItem, addItem/removeItem/updateQuantity/clearCart, getItemCount/getTotalCents"
    - "frontend/src/components/pos/cart-item-row.tsx — Minus/Plus quantity controls, Trash2 remove, formatTHB line total"
    - "frontend/src/components/pos/cart-summary-bar.tsx — Fixed bottom bar, ShoppingCart icon, item count Badge, THB total"
    - "frontend/src/components/pos/cart-bottom-sheet.tsx — Sheet side=bottom, cart list, empty state, Clear, Total, Complete Sale"
    - "frontend/src/components/pos/barcode-scanner.tsx — Dialog camera modal, video viewfinder, guide overlay, error display"
    - "frontend/src/hooks/use-barcode-scanner.ts — BarcodeDetector + html5-qrcode fallback, start/stop scanning"
    - "frontend/src/hooks/use-keyboard-wedge.ts — Rapid keystroke buffer, Enter terminates, 50ms threshold, 4 char min"
  modified:
    - "frontend/src/routes/pos/index.tsx — Wires cart store to product grid, BarcodeScanner modal, useKeyboardWedge hook"
    - "frontend/package.json — added html5-qrcode ^2.3.8"

key-decisions:
  - "variantToProductName reverse lookup in POS screen: since ProductTile only passes VariantResponse to onAddToCart, POS screen builds a {variantId → productName} map from displayProducts to attach product name to cart items"

patterns-established:
  - "Pattern: Zustand store as single source of truth for client-only cart state — server sync handled by Plan 05 offline sale"
  - "Pattern: Camera barcode detection with dual implementation — BarcodeDetector (native) for speed, html5-qrcode (JS) for broad browser support"

requirements-completed: [POS-01, POS-02, POS-05, POS-07]

# Metrics
duration: ~23min
completed: 2026-03-28
---

# Phase 02 Plan 04 Summary

**Cart management with tap-to-add and barcode scanning (camera + USB keyboard-wedge): Zustand store, bottom-sheet UI, BarcodeDetector + html5-qrcode fallback, rapid keystroke wedge detection.**

## Performance

- **Duration:** ~23 min
- **Started:** 2026-03-28T10:17:22Z
- **Completed:** 2026-03-28T10:40:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Zustand cart store (`cart-store.ts`) with addItem (increment qty if exists), removeItem, updateQuantity (auto-remove at qty=0), clearCart, getItemCount, getTotalCents
- Bottom-sheet cart (`CartBottomSheet`) with per-line quantity controls, empty state copy ("No items in cart"), Clear destructive action, running Total in THB, "Complete Sale" CTA
- Collapsed cart summary bar (`CartSummaryBar`) fixed at bottom showing item count badge + total in THB
- Camera barcode scanning (`useBarcodeScanner`): BarcodeDetector API (EAN/UPC/Code128/QR) with html5-qrcode fallback, auto-close on detection
- USB keyboard-wedge detection (`useKeyboardWedge`): <50ms keystroke threshold, Enter terminator, MIN_LENGTH 4, 200ms auto-reset — invisible to cashier
- Barcode lookup wired: `fetchProducts({search})` → `fetchVariants` → first active variant added to cart; toast.error("Barcode not found") per D-07

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Zustand cart store and cart UI components** — `2b1d34f` (feat)
2. **Task 2: Implement barcode scanning (camera + USB keyboard-wedge)** — `7ff74b7` (feat)

## Files Created/Modified

**Task 1 (5 files):**
- `frontend/src/stores/cart-store.ts` — Zustand store with CartItem interface and all cart actions
- `frontend/src/components/pos/cart-item-row.tsx` — Line item with Minus/Plus/Trash2 controls
- `frontend/src/components/pos/cart-summary-bar.tsx` — Fixed bottom bar with count + total
- `frontend/src/components/pos/cart-bottom-sheet.tsx` — Sheet side=bottom with full cart UI
- `frontend/src/routes/pos/index.tsx` — Wired cart to product grid, added CartSummaryBar + CartBottomSheet

**Task 2 (5 files):**
- `frontend/package.json` — added html5-qrcode ^2.3.8
- `frontend/src/hooks/use-barcode-scanner.ts` — BarcodeDetector + html5-qrcode hook
- `frontend/src/hooks/use-keyboard-wedge.ts` — USB scanner detection hook
- `frontend/src/components/pos/barcode-scanner.tsx` — Camera scan Dialog modal
- `frontend/src/routes/pos/index.tsx` — Wires scanner + keyboard wedge + handleBarcodeScan with toast

## Decisions Made

- **variantToProductName reverse lookup:** ProductTile only passes `VariantResponse` to `onAddToCart` (API signature can't change without breaking Plan 02-02 committed code), so POS screen builds a `{variantId → productName}` map from `displayProducts × variantsByProduct` to attach the correct product name when adding to cart
- **BarcodeDetector with any-cast:** Native BarcodeDetector API typed as `window as any` since it's not in standard TypeScript lib — gracefully falls back to html5-qrcode on unsupported browsers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added variantToProductName reverse lookup for cart item names**
- **Found during:** Task 1 (POS screen integration)
- **Issue:** ProductTile's `onAddToCart: (variant: VariantResponse) => void` API doesn't pass product name, but CartItem requires `product_name`
- **Fix:** Created reverse lookup map `variantToProductName[variant.id] = product.name` built from `displayProducts × variantsByProduct` — no ProductTile API change needed
- **Files modified:** `frontend/src/routes/pos/index.tsx`
- **Verification:** TypeScript accepts `handleAddToCart(variant)` signature matching ProductTile, cart items show correct product names
- **Committed in:** `2b1d34f` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Auto-fix was necessary for correctness (cart items would show "Unknown Product" without it). No scope creep.

## Issues Encountered

- **npm install timeout:** Adding html5-qrcode caused `npm install` to hang (300s timeout). Packages were installed correctly despite timeout — build succeeded. `frontend/package-lock.json` was never committed before this plan so no lockfile restoration needed.

## Known Stubs

None — all artifacts are functional and wired.

## Next Phase Readiness

- `useCartStore` ready for Plan 05 (offline sale: cart → order → sync queue)
- `handleBarcodeScan` + `useKeyboardWedge` ready for Plan 05 (add to existing scan → cart flow)
- Scan button (`onScanPress`) wired to `scannerOpen` state — `BarcodeScanner` modal opens on tap
- Cart bottom sheet wired: "Complete Sale" button present (action deferred to Phase 03)

---
*Phase: 02-pos-frontend-offline / Plan 04*
*Completed: 2026-03-28*
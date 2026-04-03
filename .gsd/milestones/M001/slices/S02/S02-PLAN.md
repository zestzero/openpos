# S02: Pos Frontend Offline

**Goal:** Create a minimal Sales service backend that the POS frontend needs to submit and sync orders.
**Demo:** Create a minimal Sales service backend that the POS frontend needs to submit and sync orders.

## Must-Haves


## Tasks

- [x] **T01: 02-pos-frontend-offline 00** `est:4min`
  - Create a minimal Sales service backend that the POS frontend needs to submit and sync orders.

Purpose: Plans 02-03 and 02-05 POST to `/sales/orders` for online sale completion and offline sync. No sales service exists yet. This plan creates the backend endpoint the frontend depends on — minimal order creation with inventory deduction via direct service call to inventory's createLedgerEntry.

Output: Operational Sales service with order creation (idempotent via client-generated UUID), order listing, and automatic stock deduction per line item.
- [x] **T02: 02-pos-frontend-offline 01** `est:277s (~4.6 min)`
  - Bootstrap the entire frontend application: Vite + React + TanStack Router + shadcn/ui + Tailwind CSS + PWA manifest.

Purpose: No frontend code exists yet. This plan creates the complete project scaffold that all subsequent plans build upon. Establishes routing structure (PLAT-01), PWA foundation (PLAT-04), and component library.

Output: A running Vite dev server with file-based routing, shadcn/ui ready, and PWA manifest in place.
- [x] **T03: 02-pos-frontend-offline 02** `est:45s`
  - Wire the frontend to the Encore backend API: auth context, TanStack Query data fetching, and the catalog browsing UI (category tabs + product grid + search).

Purpose: Cashiers need to see and find products to sell. This plan connects the frontend to real backend data and builds the primary catalog interface (POS-03: category browsing, POS-04: search by name/SKU).

Output: A functional POS screen showing products by category with search capability, authenticated via JWT.
- [x] **T04: 02-pos-frontend-offline 03** `est:~6min`
  - Set up the offline infrastructure: Dexie.js IndexedDB database, service worker for PWA caching, and sync queue for offline order processing.

Purpose: The POS must work without internet (OFF-01). This plan creates the data layer (Dexie.js tables for products/orders/sync queue), the PWA service worker (PLAT-04), and the sync mechanism with exponential backoff (OFF-02, OFF-03).

Output: Offline database ready for catalog caching and order storage. Service worker registered. Sync queue infrastructure in place.
- [x] **T05: 02-pos-frontend-offline 04** `est:~23min`
  - Build the cart system and barcode scanning: Zustand cart store, bottom-sheet cart UI, camera barcode scanner, and USB keyboard-wedge detection.

Purpose: This is the core POS interaction — adding items to cart (POS-05), scanning barcodes (POS-01, POS-02), and seeing the running total (POS-07). Per D-01, the cart is a bottom-sheet that slides up; per D-04, a collapsed summary bar shows count + total.

Output: Complete cart management with tap-to-add, camera scan, wedge scan, quantity adjustment, and THB-formatted totals.
- [x] **T06: 02-pos-frontend-offline 05** `est:3min`
  - Complete the POS experience: favorites/quick-keys bar and offline sale completion with sync queue integration.

Purpose: Cashiers need one-tap access to popular items (POS-06) and the ability to complete sales without internet (OFF-01). Orders created offline are queued and synced automatically with exponential backoff (OFF-02, OFF-03). Stock changes sync as delta operations (OFF-04).

Output: Full POS workflow — browse, scan, add favorites, complete sale online or offline, automatic background sync.

## Files Likely Touched

- `sales/encore.service.ts`
- `sales/datasource.ts`
- `sales/entities.ts`
- `sales/api.ts`
- `sales/migrations/1_create_sales.up.sql`
- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/tsconfig.json`
- `frontend/index.html`
- `frontend/src/main.tsx`
- `frontend/src/routes/__root.tsx`
- `frontend/src/routes/pos/route.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/lib/utils.ts`
- `frontend/tailwind.config.ts`
- `frontend/postcss.config.js`
- `frontend/src/styles/globals.css`
- `frontend/components.json`
- `frontend/src/lib/api-client.ts`
- `frontend/src/lib/auth.tsx`
- `frontend/src/lib/query-client.ts`
- `frontend/src/hooks/use-catalog.ts`
- `frontend/src/routes/pos/index.tsx`
- `frontend/src/components/pos/category-tabs.tsx`
- `frontend/src/components/pos/product-grid.tsx`
- `frontend/src/components/pos/search-bar.tsx`
- `frontend/src/main.tsx`
- `frontend/src/lib/db.ts`
- `frontend/src/lib/sync-queue.ts`
- `frontend/src/hooks/use-online-status.ts`
- `frontend/public/sw.js`
- `frontend/src/lib/register-sw.ts`
- `frontend/src/main.tsx`
- `frontend/package.json`
- `frontend/src/stores/cart-store.ts`
- `frontend/src/components/pos/cart-bottom-sheet.tsx`
- `frontend/src/components/pos/cart-item-row.tsx`
- `frontend/src/components/pos/cart-summary-bar.tsx`
- `frontend/src/components/pos/barcode-scanner.tsx`
- `frontend/src/hooks/use-barcode-scanner.ts`
- `frontend/src/hooks/use-keyboard-wedge.ts`
- `frontend/src/routes/pos/index.tsx`
- `frontend/package.json`
- `frontend/src/components/pos/favorites-bar.tsx`
- `frontend/src/stores/favorites-store.ts`
- `frontend/src/components/pos/cart-bottom-sheet.tsx`
- `frontend/src/lib/complete-sale.ts`
- `frontend/src/components/pos/sync-status-indicator.tsx`
- `frontend/src/components/pos/offline-banner.tsx`
- `frontend/src/routes/pos/index.tsx`
- `frontend/src/routes/pos/route.tsx`

# Phase 2: POS Frontend & Offline - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Cashiers can ring up sales using the mobile-first POS interface, including while offline. This phase delivers the complete POS frontend experience: product browsing, barcode scanning, cart management, and offline sale queuing with background sync. It does NOT include payment processing or receipt printing (Phase 3) or ERP backoffice (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### POS Screen Layout
- **D-01:** Bottom-sheet cart — full-screen catalog with cart as a slide-up bottom sheet/drawer. Catalog always visible; cart overlays from below.
- **D-02:** Phone-first, tablet bonus — phone portrait is the primary target. Tablet landscape gets a split-panel layout where catalog and cart are both visible side-by-side.
- **D-03:** Search bar + scan button at top — search input is always visible at the top of the screen. A camera icon button next to it triggers barcode scanning.
- **D-04:** Collapsed cart summary, expand to edit — bottom bar shows item count + running total (THB). Tap or swipe up to expand full cart with quantity controls and remove buttons.

### Barcode Scanning UX
- **D-05:** Tap-to-scan modal for camera — tapping the scan button opens a camera viewfinder modal/overlay. On successful scan, the item is added to cart and the modal auto-closes.
- **D-06:** Auto-detect rapid input for USB wedge scanners — detect rapid keystroke bursts (< 50ms between characters) ending with Enter key. No dedicated input field needed; works globally on the POS screen.
- **D-07:** Toast notification for barcode not found — non-blocking toast message "Barcode not found" displayed for ~3 seconds. Does not interrupt scanning flow.

### Frontend Project Setup
- **D-08:** shadcn/ui + Tailwind CSS — use shadcn/ui for accessible, composable UI primitives. Copy-paste ownership model (components live in the project, not node_modules).
- **D-09:** TanStack Query + Zustand — TanStack Query for server state (catalog data, sync status). Zustand for client state (cart contents, UI state like sheet open/closed).
- **D-10:** TanStack Router — type-safe file-based routing with built-in data loading. Route groups: `/pos/*` for POS screens, `/erp/*` for future ERP screens.
- **D-11:** Encore generated client + TanStack Query wrappers — use Encore's auto-generated TypeScript client for API calls, wrapped in TanStack Query hooks for caching/loading/error states.

### Agent's Discretion
- **Catalog & Favorites:** Category grid design (tile size, layout, icons), favorites bar behavior (how items are pinned, horizontal scroll vs grid), variant selection UX when a product has multiple variants (inline picker vs modal).
- **Offline Strategy & Sync:** Pre-caching strategy for catalog data (full sync on login vs lazy), offline order storage format in IndexedDB/Dexie.js, sync queue UI indicators (pending count, retry status), delta sync conflict handling approach per research guidance.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Barcode Scanning
- `.planning/research/FEATURES.md` §Barcode Scanning — BarcodeDetector API details, camera vs USB wedge approaches, browser support matrix

### Offline Architecture
- `.planning/research/FEATURES.md` §Offline Architecture — Dexie.js + service worker patterns, IndexedDB schema design
- `.planning/research/SUMMARY.md` §Pitfalls (Last Write Wins) — conflict resolution strategy and known pitfalls for offline sync

### Backend API Shape (Phase 1)
- `.planning/phases/01-foundation-backend-core/01-CONTEXT.md` — Product→Variant hierarchy, inventory ledger pattern, data model decisions
- `catalog/api.ts` — Category/Product/Variant CRUD endpoints, search via `?search=` ILIKE
- `catalog/entities.ts` — Entity definitions: Category (id, name, sort_order), Product (id, name, description, category_id, archived), Variant (id, product_id, sku, barcode, price_cents, cost_cents, active)
- `auth/middleware.ts` — JWT authHandler, requireRole middleware, Gateway config
- `auth/auth.ts` — pinLogin endpoint for cashier authentication

### Research
- `.planning/research/STACK.md` — Recommended frontend stack (Vite, React, TanStack Query, Dexie.js, Workbox)
- `.planning/research/PITFALLS.md` — Known risks and mitigation strategies

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No frontend code exists yet — this phase bootstraps the entire frontend application
- Backend services are fully operational: `auth/`, `catalog/`, `inventory/` with REST APIs

### Established Patterns
- **Backend data format:** All monetary values in `_cents` integer format (e.g., `price_cents: 2500` = ฿25.00). Frontend must divide by 100 for display and format as THB.
- **UUID primary keys:** All entities use UUID v4. Frontend must handle UUID strings, not auto-increment integers.
- **Search API:** `catalog/api.ts` exposes `?search=` param using ILIKE on name/SKU/barcode. Frontend search can hit this directly.
- **Auth flow:** JWT Bearer token in Authorization header. Cashiers use PIN login (`pinLogin` endpoint). Token contains role (OWNER/CASHIER).

### Integration Points
- **Encore generated client:** Will need to set up `encore.gen` client generation for the frontend. The backend uses `~encore/*` path aliases.
- **API Gateway:** Auth middleware runs at gateway level — frontend sends JWT in headers.
- **Route structure:** `/pos/*` for POS interface (this phase), `/erp/*` for backoffice (Phase 4). Single SPA with route-based separation per PLAT-01.
- **PWA entry point:** Service worker registration, manifest.json, offline fallback page — all new.

</code_context>

<specifics>
## Specific Ideas

- Bottom sheet cart should feel native — similar to Google Maps or ride-sharing apps where the bottom sheet is the primary interaction pattern on mobile.
- USB wedge scanner detection should be invisible — no special mode or toggle. The POS screen should just "know" when a barcode scanner fires rapid keystrokes vs. normal typing.
- THB formatting: ฿ symbol prefix, two decimal places (e.g., ฿25.00). Use `price_cents / 100` conversion consistently.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-pos-frontend-offline*
*Context gathered: 2026-03-28*

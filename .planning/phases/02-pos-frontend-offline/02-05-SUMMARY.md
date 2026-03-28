---
phase: 02-pos-frontend-offline
plan: 05
subsystem: ui
tags: [pos, offline, sync, favorites, zustand, dexie]

# Dependency graph
requires:
  - phase: 02-pos-frontend-offline
    plan: 04
    provides: Cart store, bottom sheet, barcode scan, useKeyboardWedge hook
  - phase: 02-pos-frontend-offline
    plan: 03
    provides: IndexedDB schema, sync-queue with exponential backoff, useOnlineStatus hook
provides:
  - Favorites bar with localStorage persistence and one-tap add to cart (POS-06)
  - Sale completion online (direct POST) and offline (IndexedDB queue) (OFF-01)
  - Offline banner and sync status indicator in POS layout
affects: [03-erp-backend, 02-pos-frontend-offline plans beyond 05]

# Tech tracking
tech-stack:
  added: [uuid (v4 for client-generated order IDs)]
  patterns:
    - "Offline-first sale completion: online-first with offline fallback to queue"
    - "Delta sync: send variant_id+quantity operations not absolute stock values"
    - "Zustand persist middleware for favorites localStorage"
    - "Client-generated UUIDs for offline idempotency"

key-files:
  created:
    - frontend/src/stores/favorites-store.ts
    - frontend/src/components/pos/favorites-bar.tsx
    - frontend/src/lib/complete-sale.ts
    - frontend/src/components/pos/sync-status-indicator.tsx
    - frontend/src/components/pos/offline-banner.tsx
  modified:
    - frontend/src/components/pos/cart-bottom-sheet.tsx
    - frontend/src/routes/pos/index.tsx
    - frontend/src/routes/pos/route.tsx

key-decisions:
  - "Online-first sale completion: try POST first, fall through to offline queue on any error"
  - "Delta sync compliance: complete-sale.ts sends quantity operations not absolute stock (OFF-04)"
  - "Client-generated UUIDs via uuid v4: server never assigns order IDs for offline safety"
  - "Favorites bar hidden when no favorites pinned (returns null to avoid empty strip)"

patterns-established:
  - "POS layout route (/pos/route.tsx) wraps all POS pages with persistent offline/sync UI"
  - "Complete sale button shows 'Processing...' loading state and 'Offline — sale will be queued' hint"

requirements-completed: [POS-06, OFF-01, OFF-02, OFF-03, OFF-04]

# Metrics
duration: 3min
completed: 2026-03-28
---

# Phase 02: POS Frontend Offline — Plan 05 Summary

**Favorites bar with localStorage persistence, offline sale completion (online-first with IndexedDB queue fallback), offline banner, and sync status indicator — completing the POS experience.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-28T10:58:29Z
- **Completed:** 2026-03-28T11:01:50Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Favorites bar (horizontal scroll strip) with one-tap add-to-cart, persisted via Zustand+localStorage
- Sale completion with online-first direct POST, falling back to offline IndexedDB queue (enqueueOrder)
- Delta sync: POST sends `variant_id + quantity` operations, never absolute stock values (OFF-04 compliance)
- Offline banner (amber warning) and sync status indicator (pending count with spinning icon) in POS layout
- Complete Sale button wired with loading state and offline queuing hint

## Task Commits

Each task was committed atomically:

1. **Task 1+2 combined (all files):** - `59d70d7` (feat)
   - favorites-store.ts, favorites-bar.tsx, complete-sale.ts, cart-bottom-sheet.tsx, pos/index.tsx, sync-status-indicator.tsx, offline-banner.tsx, pos/route.tsx

**Plan metadata:** `59d70d7` (feat: complete plan)

## Files Created/Modified
- `frontend/src/stores/favorites-store.ts` — Zustand store with persist middleware for favorite variant IDs
- `frontend/src/components/pos/favorites-bar.tsx` — Horizontal scroll strip of pinned items with one-tap add
- `frontend/src/lib/complete-sale.ts` — Sale completion: online POST or offline queue with delta sync payload
- `frontend/src/components/pos/cart-bottom-sheet.tsx` — Wired Complete Sale button with loading/synced states
- `frontend/src/routes/pos/index.tsx` — Added FavoritesBar between CategoryTabs and ProductGrid
- `frontend/src/components/pos/sync-status-indicator.tsx` — Pending sync count badge with animated spinner
- `frontend/src/components/pos/offline-banner.tsx` — Amber warning banner when device is offline
- `frontend/src/routes/pos/route.tsx` — POS layout with OfflineBanner and SyncStatusIndicator in header row

## Decisions Made
- Online-first sale completion: try direct POST when `navigator.onLine`, fall through to `enqueueOrder` on any error (network or server error)
- Client-generated UUIDs via `uuidv4`: ensures offline-created orders have stable IDs before they reach the server
- Delta sync in API payload: `items[]` contains `variant_id + quantity + price_cents` per line, never absolute stock levels
- Sync status indicator polls `getPendingSyncCount()` every 5s and auto-triggers `processSyncQueue()` when online

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Full POS workflow is complete: browse → search → scan → barcode → favorites → cart → complete sale → sync
- All OFF-01 through OFF-04 requirements implemented
- Ready for Phase 03 ERP backend work or Phase 02 remaining plans

---
*Phase: 02-pos-frontend-offline*
*Plan: 05*
*Completed: 2026-03-28*

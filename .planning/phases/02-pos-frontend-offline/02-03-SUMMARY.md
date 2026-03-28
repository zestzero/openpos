---
phase: 02-pos-frontend-offline
plan: "03"
subsystem: infra
tags: [dexie, indexeddb, service-worker, pwa, offline, sync-queue, exponential-backoff]

# Dependency graph
requires:
  - phase: "02-pos-frontend-offline/02-01"
    provides: "Vite + React SPA with TanStack Router, shadcn/ui, PWA manifest"
provides:
  - "Dexie.js IndexedDB with 5 typed tables for offline data persistence"
  - "Sync queue with exponential backoff (1s-16s, max 5 attempts) for offline order sync"
  - "Reactive online/offline detection hook triggering background sync on reconnect"
  - "PWA service worker caching app shell (static assets cache-first, navigation network-first with SPA fallback)"
affects:
  - "02-pos-frontend-offline (subsequent plans use offline database for catalog caching)"
  - "03-payments-receipts (receipt printing works offline via service worker)"

# Tech tracking
tech-stack:
  added:
    - dexie ^4.0.0
    - dexie-react-hooks ^1.1.7
    - uuid ^11.0.0
    - @types/uuid ^10.0.0
  patterns:
    - "Dexie.js EntityTable pattern for typed IndexedDB tables"
    - "Exponential backoff retry (1s, 2s, 4s, 8s, 16s, max 5 attempts) for sync queue"
    - "Cache-first for static assets, network-first with SPA fallback for navigation in service worker"
    - "Offline-first: write to IndexedDB immediately, sync in background when online"

key-files:
  created:
    - "frontend/src/lib/db.ts — Dexie database with 5 tables (categories, products, variants, orders, syncQueue)"
    - "frontend/src/lib/sync-queue.ts — enqueueOrder, processSyncQueue, exponentialBackoff, getPendingSyncCount, getFailedOrders"
    - "frontend/src/hooks/use-online-status.ts — React hook returning isOnline, triggers sync on reconnect"
    - "frontend/src/lib/register-sw.ts — registerServiceWorker() wrapper"
    - "frontend/public/sw.js — PWA service worker (cache-first static, network-first nav, SPA fallback)"
    - "frontend/src/vite-env.d.ts — Vite ImportMeta.env TypeScript augmentation"
  modified:
    - "frontend/package.json — added dexie, dexie-react-hooks, uuid, @types/uuid"
    - "frontend/src/main.tsx — added registerServiceWorker() call after app mount"

key-decisions:
  - "Used hand-written service worker (not Workbox) to keep plan focused — Workbox can be added as refinement later"
  - "Delta sync: POST order as CREATE_ORDER operation (item decrements), not absolute state — per Pitfall 4 research guidance"
  - "Client-side UUID generation for offline orders — server never assigns IDs to offline-created records"
  - "Sync queue processes sequentially to maintain order consistency on the server"

patterns-established:
  - "Pattern: Sync queue as separate IndexedDB table alongside orders table — queue is the processing state, orders table is the source of truth"
  - "Pattern: Online status hook drives sync trigger — no polling, purely event-driven"

requirements-completed: [OFF-01, OFF-02, OFF-03, PLAT-04]

# Metrics
duration: ~6min
completed: 2026-03-28
---

# Phase 02 Plan 03 Summary

**Offline infrastructure: Dexie.js IndexedDB with 5 typed tables, exponential-backoff sync queue, and PWA service worker caching the app shell for offline POS operation**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-28T10:04:52Z
- **Completed:** 2026-03-28T10:10:50Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Dexie.js database with 5 typed tables: categories (catalog cache), products, variants, orders (offline orders), syncQueue (pending sync operations)
- Sync queue with exponential backoff (1s → 2s → 4s → 8s → 16s, max 5 attempts) for resilient offline order sync
- Online/offline detection hook (`useOnlineStatus`) that triggers background sync automatically when coming back online
- PWA service worker: cache-first for JS/CSS/fonts/images, network-first for navigation with cached index.html SPA fallback
- Service worker registered on app startup via `registerServiceWorker()` in main.tsx

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Dexie.js database with offline tables and sync queue logic** - `9a0845d` (feat)
2. **Task 2: Create PWA service worker and register it** - `bbba3ac` (feat)

## Files Created/Modified

- `frontend/package.json` — added dexie ^4.0.0, dexie-react-hooks ^1.1.7, uuid ^11.0.0, @types/uuid ^10.0.0
- `frontend/package-lock.json` — npm install results
- `frontend/src/lib/db.ts` — Dexie database with 5 typed tables and entity interfaces
- `frontend/src/lib/sync-queue.ts` — enqueueOrder, processSyncQueue with exponentialBackoff, getPendingSyncCount, getFailedOrders
- `frontend/src/hooks/use-online-status.ts` — useOnlineStatus hook with reconnect sync trigger
- `frontend/src/vite-env.d.ts` — Vite ImportMeta.env TypeScript type augmentation (blocks `import.meta.env` TS error)
- `frontend/public/sw.js` — PWA service worker: cache-first static, network-first nav, SPA fallback
- `frontend/src/lib/register-sw.ts` — registerServiceWorker() wrapper
- `frontend/src/main.tsx` — added registerServiceWorker() import and call after app mount

## Decisions Made

- **Hand-written SW vs Workbox:** Used hand-written service worker rather than Workbox build integration to keep Plan 03 focused on core offline infrastructure. Workbox can be layered in as a future refinement without architectural changes.
- **Delta sync:** Sync queue POSTs order as a CREATE_ORDER operation (item quantities to decrement), not absolute stock values — per Pitfall 4 research guidance on last-write-wins conflict resolution.
- **Client-side UUIDs:** Offline orders use client-generated UUIDs — server never assigns IDs to offline-created records, preventing ID conflicts on sync.
- **Sequential sync:** Sync queue processes entries one at a time (for loop, not Promise.all) to maintain order consistency on the server.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added vite-env.d.ts for ImportMeta.env TypeScript types**
- **Found during:** Task 1 (sync-queue.ts creation)
- **Issue:** `import.meta.env.VITE_API_URL` caused TypeScript error "Property 'env' does not exist on type 'ImportMeta'" — no vite-env.d.ts existed in the project
- **Fix:** Created `frontend/src/vite-env.d.ts` with `/// <reference types="vite/client" />` and `ImportMetaEnv` interface
- **Files modified:** `frontend/src/vite-env.d.ts` (new)
- **Verification:** TypeScript error resolved, build succeeds
- **Committed in:** `9a0845d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was necessary for TypeScript compilation. No scope creep.

## Issues Encountered

None — plan executed smoothly after the TypeScript vite-env fix.

## Known Stubs

None — all artifacts are functional and wired.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Offline database ready for catalog caching (Plans 02-04 and 02-05 will populate the catalog cache on login)
- Sync queue ready for order enqueuing (Plans 02-05 will wire cart checkout to enqueueOrder)
- Service worker ready — POS app shell loads offline once cached on first visit

---
*Phase: 02-pos-frontend-offline / Plan 03*
*Completed: 2026-03-28*

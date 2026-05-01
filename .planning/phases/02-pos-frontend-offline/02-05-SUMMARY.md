---
phase: 02-pos-frontend-offline
plan: 05
subsystem: offline
tags: [dexie, indexeddb, service-worker, pwa, offline]

# Dependency graph
requires:
  - phase: 02-pos-frontend-offline
    provides: POS frontend shell, catalog API, order creation endpoint
  - phase: 02-02
    provides: POST /api/orders/sync for offline order reconciliation
provides:
  - Dexie.js IndexedDB for catalog cache and order queue
  - Network status detection with online/offline events
  - Offline order completion (queue locally when offline)
  - Background sync with exponential backoff retry
  - Service worker for app shell caching
  - PWA manifest for installability
affects: [pos-frontend-offline, payments]

# Tech tracking
tech-stack:
  added: [dexie, service-worker, manifest]
  patterns:
    - IndexedDB for catalog and order persistence
    - Exponential backoff for sync retry
    - Delta-based stock operations

key-files:
  created:
    - frontend/src/lib/db.ts (Dexie schema)
    - frontend/src/pos/hooks/useNetworkStatus.ts
    - frontend/src/pos/hooks/useOfflineOrders.ts
    - frontend/src/pos/hooks/useSync.ts
    - frontend/src/pos/components/OfflineBanner.tsx
    - frontend/src/pos/components/SyncStatus.tsx
    - frontend/public/manifest.json
  modified:
    - frontend/index.html
    - frontend/vite.config.ts

key-decisions:
  - "Dexie.js for IndexedDB - simpler than raw IndexedDB API"
  - "Exponential backoff starting at 1s, max 5 retries"
  - "Orders queued locally when offline, synced when online"

patterns-established:
  - "Offline-first: queue orders locally, sync in background"
  - "Service worker caches app shell for offline use"

requirements-completed: [OFF-01, OFF-02, OFF-03, OFF-04]

duration: ~10 min
completed: 2026-04-26
---

# Phase 02 Plan 05: Offline POS Summary

**Offline-first POS capability with IndexedDB cache, order queue, and background sync.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Implemented Dexie.js IndexedDB schema for catalog cache and order queue.
- Added network status detection hooks.
- Created offline order queue with retry logic.
- Implemented background sync with exponential backoff.
- Added PWA manifest for installability.

## Task Commits

1. **Task 1: Set up Dexie.js IndexedDB schema and offline order hooks** - `2141a1e`
2. **Task 2: Implement background sync with exponential backoff** - `47d42ff`

## Files Created/Modified

- `frontend/src/lib/db.ts` - Dexie database schema
- `frontend/src/pos/hooks/useNetworkStatus.ts` - Network detection
- `frontend/src/pos/hooks/useOfflineOrders.ts` - Order queue management
- `frontend/src/pos/hooks/useSync.ts` - Background sync with backoff
- `frontend/src/pos/components/OfflineBanner.tsx` - Offline indicator
- `frontend/src/pos/components/SyncStatus.tsx` - Sync status display
- `frontend/public/manifest.json` - PWA manifest

## Decisions Made

- Used Dexie.js for simpler IndexedDB management
- Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5 retries)
- Orders queued with pending/syncing/failed status

## Issues Encountered

- None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- POS can now complete sales offline and sync when back online.
- Phase 2 is complete - all plans executed.

---

*Phase: 02-pos-frontend-offline*
*Completed: 2026-04-26*

## Self-Check: PASSED
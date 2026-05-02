---
phase: 05-pos-frontend-offline-gap-closure
plan: 01
subsystem: offline
tags: [dexie, indexeddb, sync-contract, retry, vitest]

# Dependency graph
requires:
  - phase: 02-pos-frontend-offline
    provides: Dexie offline queue, order sync endpoint, and existing POS queue hooks
provides:
  - Shared offline sync-contract helper for queued order serialization and retry math
  - Dexie sync-state derivation from queued-order statuses
  - Client UUID keyed sync error lookup for batch retries
affects: [05-02-PLAN.md, POS offline sync flow, queued order retry behavior]

# Tech tracking
tech-stack:
  added: [vitest]
  patterns: [shared sync-contract helper, Dexie-derived sync snapshots, client_uuid keyed retry handling]

key-files:
  created:
    - frontend/src/pos/hooks/syncContract.ts
    - frontend/src/pos/__tests__/syncContract.test.ts
    - .planning/phases/05-pos-frontend-offline-gap-closure/deferred-items.md
  modified:
    - frontend/src/pos/hooks/useOfflineOrders.ts
    - frontend/src/pos/hooks/useSync.ts

key-decisions:
  - "Use a shared sync-contract helper so payload shape, error indexing, and retry delay logic stay aligned across hooks"
  - "Treat failed queue entries as retryable sync work instead of losing them behind a client_uuid/order_id mismatch"
  - "Derive sync counters from actual Dexie rows after each queue mutation"

patterns-established:
  - "Queued offline orders serialize to snake_case backend fields in one shared helper"
  - "Sync state is recomputed from Dexie queue rows instead of inferred from local hook state"

requirements-completed: [OFF-01, OFF-02, OFF-03, OFF-04]

# Metrics
duration: 25 min
completed: 2026-05-02
---

# Phase 05 Plan 01: Offline Sync Contract Closure Summary

**Shared offline sync contract helpers with Dexie-backed retry state and regression coverage for queued POS orders**

## Performance

- **Duration:** 25 min
- **Started:** 2026-05-02T03:00:00Z
- **Completed:** 2026-05-02T03:24:19Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extracted a shared sync contract helper for queued order serialization, backend error indexing, and retry backoff.
- Wired POS offline hooks to recompute sync state from Dexie rows and retry failed batches by `client_uuid`.
- Added regression tests that lock the payload contract and backoff behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract the shared offline-sync contract** - `b447b27` (feat)
2. **Task 2: Wire offline queue state to the shared contract** - `1ea3d40` (fix)

**Plan metadata:** pending

## Files Created/Modified
- `frontend/src/pos/hooks/syncContract.ts` - shared sync payload, error, snapshot, and retry helpers
- `frontend/src/pos/__tests__/syncContract.test.ts` - regression tests for payload mapping and retry math
- `frontend/src/pos/hooks/useOfflineOrders.ts` - refreshes sync state from actual Dexie rows after queue mutations
- `frontend/src/pos/hooks/useSync.ts` - uses shared helpers for batch sync, retries, and last-sync bookkeeping
- `.planning/phases/05-pos-frontend-offline-gap-closure/deferred-items.md` - logged unrelated build blocker

## Decisions Made
- Used `client_uuid` as the only sync identity key; no secondary `order_id` alias was introduced.
- Failed sync batches stay retryable so offline checkouts do not disappear after an error.
- `pendingCount` and `isSyncing` are derived from queued-order statuses rather than stale local assumptions.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered
- `frontend/src/routes/pos.tsx` has an unrelated `QuickKeysBar` unused import (`TS6133`) that blocks a full frontend build.
- Logged in `.planning/phases/05-pos-frontend-offline-gap-closure/deferred-items.md` and left untouched because it is outside this plan's scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Offline sync contract is now centralized and covered by regression tests.
- Phase 05-02 can build on the corrected queue state bookkeeping.

---
*Phase: 05-pos-frontend-offline-gap-closure*
*Completed: 2026-05-02*

## Self-Check: PASSED

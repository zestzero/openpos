---
phase: 08-receipt-replay-reopen-closure
plan: 01
subsystem: ui
tags: [receipt, pos, vitest, react, localStorage]

# Dependency graph
requires:
  - phase: 03-payments-receipts
    provides: receipt snapshot, payment completion print flow
  - phase: 06-payments-receipts-sale-finalization
    provides: checkout finalization and persisted receipt endpoint
provides:
  - persisted latest-receipt lookup and reprint flow via GET /api/orders/{id}/receipt
  - lightweight POS "Reprint receipt" action with offline disable/error copy
  - checkout success now remembers latest paid receipt id for later replay
affects: [phase 09, POS selling floor, receipt replay, checkout finalization]

# Tech tracking
tech-stack:
  added: []
  patterns: [localStorage-backed latest-receipt state, custom event sync across POS components, endpoint-backed replay with offline guard]

key-files:
  created: [frontend/src/pos/hooks/useLatestReceipt.ts, frontend/src/pos/components/LatestReceiptReprint.tsx]
  modified: [frontend/src/lib/constants.ts, frontend/src/pos/components/CartPanel.tsx, frontend/src/routes/pos.tsx, frontend/src/routes/__tests__/pos-receipt-replay.test.tsx]

key-decisions:
  - "Persisted receipt replay now treats GET /api/orders/{id}/receipt as source of truth and never attempts offline replay."
  - "The POS surface uses a lightweight inline Reprint receipt affordance instead of a recent-orders list or reopen-sale flow."
  - "Latest receipt changes broadcast across POS components so the shell updates immediately after successful checkout."

patterns-established:
  - "Pattern 1: localStorage-backed latest receipt state with guarded read/write helpers"
  - "Pattern 2: endpoint-backed replay with a disabled offline state and non-destructive error copy"

requirements-completed: [REC-03]

# Metrics
duration: 7 min
completed: 2026-05-03
---

# Phase 08: Receipt Replay & Re-open Closure Summary

**Latest-receipt replay now fetches persisted backend receipts and exposes a lightweight offline-disabled Reprint receipt action in the POS shell.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-03T07:24:27Z
- **Completed:** 2026-05-03T07:31:32Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added a localStorage-backed latest receipt hook with endpoint-backed reprint.
- Added the POS "Reprint receipt" action and offline/failure messaging.
- Recorded the latest paid order id after checkout so later replay uses the persisted receipt endpoint.

## Task Commits

1. **Task 1: add latest-receipt replay contract and regression tests** - `389ef04`, `6d17c19`, `0e8fa90`
2. **Task 2: build the cashier-facing Reprint receipt action** - `5a42d7e`
3. **Task 3: record the latest paid order during checkout finalization** - `dd9d557`

**Plan metadata:** `0e8fa90` (test: align receipt replay mocks with hook errors)

## Files Created/Modified

- `frontend/src/lib/constants.ts` - adds the persisted latest receipt storage key
- `frontend/src/pos/hooks/useLatestReceipt.ts` - localStorage-backed receipt replay hook
- `frontend/src/pos/components/LatestReceiptReprint.tsx` - cashier-facing reprint action
- `frontend/src/pos/components/CartPanel.tsx` - records the latest paid receipt id after successful checkout
- `frontend/src/routes/pos.tsx` - mounts the reprint affordance in the POS shell
- `frontend/src/routes/__tests__/pos-receipt-replay.test.tsx` - regression coverage for replay, offline disable, error copy, and wording guards

## Decisions Made

- Persisted receipt replay must always fetch the backend receipt endpoint instead of reusing the payment snapshot.
- The POS shell should show a small inline reprint action instead of any recent-orders or reopen-sale UI.
- Receipt replay stays online-only; offline state is disabled and explanatory, not a fallback replay path.
- Latest receipt state is shared across POS components through a guarded localStorage helper plus an in-tab update event.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Shared latest-receipt updates needed cross-component syncing**
- **Found during:** Task 3
- **Issue:** Separate hook instances meant the POS shell would not show the latest receipt action immediately after checkout.
- **Fix:** Added a lightweight custom event broadcast plus storage sync in `useLatestReceipt` so the shell refreshes instantly.
- **Files modified:** frontend/src/pos/hooks/useLatestReceipt.ts
- **Verification:** Targeted Vitest suite passed
- **Committed in:** `6d17c19`

**2. [Rule 3 - Blocking] Test mock alignment**
- **Found during:** Task 1 verification
- **Issue:** The replay regression needed a mocked `ApiError` export and typed `PosLayout` stub.
- **Fix:** Extended the test mock so the hook error path could be exercised without unhandled rejections.
- **Files modified:** frontend/src/routes/__tests__/pos-receipt-replay.test.tsx
- **Verification:** Targeted Vitest suite passed
- **Committed in:** `0e8fa90`

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both fixes were necessary for correctness and testability. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

REC-03 replay wiring is complete and verified.
Ready for the next plan in the phase sequence.

## Self-Check: PASSED

---
*Phase: 08-receipt-replay-reopen-closure*
*Completed: 2026-05-03*

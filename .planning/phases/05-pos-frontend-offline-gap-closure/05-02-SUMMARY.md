---
phase: 05-pos-frontend-offline-gap-closure
plan: 02
subsystem: frontend
tags: [react, tanstack-router, vitest, testing, pos, offline]

# Dependency graph
requires:
  - phase: 02-pos-frontend-offline
    provides: mobile POS shell, cashier route tree, offline network hook, and cashier-facing catalog/scan surfaces
provides:
  - exportable cashier route components for direct smoke coverage
  - shared network-status source in the POS shell
  - quick-keys visibility on the main cashier floor
  - focused POS shell smoke coverage for selling, catalog, and scan routes
affects: [05-pos-frontend-offline-gap-closure, 06-payments-receipts, 07-erp-management-reporting]

# Tech tracking
tech-stack:
  added: [vitest smoke coverage]
  patterns: [named route exports, shared network-status hook, deterministic shell mocks]

key-files:
  created: [frontend/src/routes/__tests__/pos-shell.test.tsx]
  modified: [frontend/src/routes/pos.tsx, frontend/src/routes/pos.catalog.tsx, frontend/src/routes/pos.scan.tsx, frontend/src/pos/layout/PosLayout.tsx]

key-decisions:
  - "Exported the cashier route components as named functions so the shell can be rendered directly in tests."
  - "Switched the POS layout to the shared useNetworkStatus hook so online/offline state comes from one source."
  - "Placed QuickKeysBar on the main cashier floor so the quick-key requirement is visible again."
  - "Used deterministic mocks for auth, cart, favorites, network, wedge scanning, and scanner UI in the smoke suite."

patterns-established:
  - "Pattern 1: Route modules expose named inner components for direct smoke coverage."
  - "Pattern 2: POS shell status reads through the shared network hook only."
  - "Pattern 3: Shell regression tests assert visible cashier surfaces instead of snapshots."

requirements-completed: [POS-01, POS-02, POS-03, POS-04, POS-05, POS-06, POS-07, PLAT-01, PLAT-04]

# Metrics
duration: 5 min
completed: 2026-05-02
---

# Phase 05: POS Frontend Offline Gap Closure Summary

**Cashier route exports, a shared online/offline source, and regression coverage for the POS shell, catalog, and scan surfaces.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-02T03:25:12Z
- **Completed:** 2026-05-02T03:30:07Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Exported the cashier route components so the selling floor, catalog page, and scan page can be rendered directly.
- Replaced the POS shell’s private online-status hook with the shared network-status hook.
- Restored the quick-keys bar on the cashier floor and covered the POS shell with a focused Vitest smoke suite.

## Task Commits

Each task was committed atomically:

1. **Task 1: Export the cashier route components and render quick keys** - `5e182e1` (feat)
2. **Task 2: Add a POS shell smoke test for all cashier pages** - `3b8397a` (test)

## Files Created/Modified
- `frontend/src/routes/pos.tsx` - exports the cashier selling-floor component and restores quick keys visibility
- `frontend/src/routes/pos.catalog.tsx` - exports the catalog route component
- `frontend/src/routes/pos.scan.tsx` - exports the scan route component
- `frontend/src/pos/layout/PosLayout.tsx` - uses the shared network-status hook
- `frontend/src/routes/__tests__/pos-shell.test.tsx` - smoke coverage for the cashier shell pages

## Decisions Made
- Exported route inner components to make the shell directly testable.
- Kept the shell structure intact while restoring the quick-key bar in the main POS view.
- Used deterministic mocks to keep the smoke test focused on visible cashier surfaces.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- POS shell route tree is now verifiable after the offline-sync repair.
- Downstream payment and ERP work still has a stable shell contract to build on.

---
*Phase: 05-pos-frontend-offline-gap-closure*
*Completed: 2026-05-02*

## Self-Check: PASSED

- Summary file exists.
- Task commits found: `5e182e1`, `3b8397a`.

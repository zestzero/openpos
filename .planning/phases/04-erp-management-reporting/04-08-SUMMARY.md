---
phase: 04-erp-management-reporting
plan: 08
subsystem: ui
tags: [react, tanstack-query, tanstack-router, recharts, reporting, thb]

# Dependency graph
requires:
  - phase: 04-02
    provides: reporting APIs for monthly sales and gross profit
  - phase: 04-04
    provides: Vitest/jsdom setup for ERP UI tests
  - phase: 04-05
    provides: owner-gated ERP shell and desktop layout
provides:
  - ERP reporting route
  - THB KPI cards for monthly sales and gross profit
  - Live chart panel with merged reporting rows
affects:
  - ERP shell navigation
  - ERP export work in plan 04-09

# Tech tracking
tech-stack:
  added: [recharts]
  patterns: [query-driven dashboards, row-merging read-model adapters, route-backed ERP tabs]

key-files:
  created:
    - frontend/src/routes/erp.reports.tsx
    - frontend/src/lib/reporting-api.ts
    - frontend/src/erp/reports/ReportDashboard.tsx
    - frontend/src/erp/reports/ReportCards.tsx
    - frontend/src/erp/reports/ReportChart.tsx
    - frontend/src/erp/__tests__/reporting.test.tsx
  modified:
    - frontend/package.json
    - frontend/pnpm-lock.yaml
    - frontend/src/routeTree.gen.ts
    - frontend/src/erp/layout/ErpLayout.tsx
    - .planning/phases/04-erp-management-reporting/deferred-items.md

key-decisions:
  - "Load monthly-sales and gross-profit independently with TanStack Query, then merge rows client-side for the dashboard."
  - "Render reporting as THB KPI cards plus a Recharts panel with an accessible monthly breakdown list."
  - "Wire the ERP tabs to navigate to /erp/reports so the reporting route is reachable from the shell."

patterns-established:
  - "Pattern 1: query-backed reporting panels that merge multiple read models into one dashboard view"
  - "Pattern 2: accessible chart panel with a human-readable monthly summary beside the visualization"

requirements-completed: [RPT-01, RPT-02, PLAT-05]

# Metrics
duration: 16 min
completed: 2026-04-26
---

# Phase 04: ERP Management & Reporting Summary

**Monthly ERP reporting dashboard with live sales/profit queries, THB KPI cards, and chart-backed monthly breakdowns.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-04-26T04:03:00Z
- **Completed:** 2026-04-26T04:19:02Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Added a dedicated `/erp/reports` route and wired the ERP shell to reach it.
- Fetched monthly-sales and gross-profit read models with TanStack Query and merged them into one dashboard view.
- Rendered THB KPI cards plus a Recharts panel with accessible monthly breakdown rows.

## Task Commits

1. **Task 1: Build the reporting dashboard and route** - `5d3393a`
2. **Task 2: Verify the chart panel and report data flow** - `2814bfc`

## Files Created/Modified

- `frontend/src/routes/erp.reports.tsx` - Reporting route module.
- `frontend/src/lib/reporting-api.ts` - Reporting API client plus row-merging helpers.
- `frontend/src/erp/reports/ReportDashboard.tsx` - Query-backed dashboard composition.
- `frontend/src/erp/reports/ReportCards.tsx` - THB KPI cards and trend deltas.
- `frontend/src/erp/reports/ReportChart.tsx` - Recharts panel and monthly breakdown.
- `frontend/src/erp/__tests__/reporting.test.tsx` - Dashboard/chart coverage.
- `frontend/src/erp/layout/ErpLayout.tsx` - Shell tab navigation for reporting access.
- `frontend/src/routeTree.gen.ts` - Registered the reporting route.
- `frontend/package.json` / `frontend/pnpm-lock.yaml` - Added `recharts`.

## Decisions Made

- Use client-side row merging for the dashboard instead of introducing a new backend aggregate.
- Keep all reporting amounts in satang internally and display THB with the shared formatter.
- Make the reporting route reachable from the ERP shell tabs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing chart dependency**
- **Found during:** Task 1
- **Issue:** `recharts` was not installed, so the chart panel could not compile.
- **Fix:** Added `recharts` with pnpm and committed the lockfile update.
- **Files modified:** `frontend/package.json`, `frontend/pnpm-lock.yaml`
- **Committed in:** `5d3393a`

**2. [Rule 2 - Missing Critical] Wired ERP tabs to the reporting route**
- **Found during:** Task 1
- **Issue:** The new reporting route existed, but the shell had no navigation into it.
- **Fix:** Added route-backed tab navigation in `ErpLayout`.
- **Files modified:** `frontend/src/erp/layout/ErpLayout.tsx`
- **Committed in:** `5d3393a`

**3. [Rule 1 - Bug] Fixed chart accessibility/type issues**
- **Found during:** Task 2
- **Issue:** The chart tooltip typing and region labeling needed cleanup for reliable tests and accessible semantics.
- **Fix:** Adjusted the chart wrapper labeling and simplified tooltip typing.
- **Files modified:** `frontend/src/erp/reports/ReportChart.tsx`
- **Committed in:** `2814bfc`

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 missing critical, 1 bug)
**Impact on plan:** All fixes were necessary to make the reporting dashboard reachable, compilable, and testable.

## Issues Encountered

- `rtk tsc -b` still reports pre-existing ERP test/type errors in `frontend/src/erp/__tests__/erp-management.test.tsx`, `frontend/src/erp/__tests__/vitest-setup.test.tsx`, and `frontend/src/erp/import/ImportDrawer.tsx`. These are unrelated to the reporting dashboard and were logged in `deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Monthly sales and gross profit reporting is now visible in the ERP shell.
- Plan 04-09 can add export actions on top of the live reporting data.

## Self-Check: PASSED

- Summary file exists.
- Task commits found in git history.
- Reporting tests pass.

---
*Phase: 04-erp-management-reporting*
*Completed: 2026-04-26*

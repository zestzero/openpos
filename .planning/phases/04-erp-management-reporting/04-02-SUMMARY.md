---
phase: 04-erp-management-reporting
plan: 02
subsystem: api
tags: [postgres, sqlc, chi, reporting, gross-profit, monthly-sales]

requires:
  - phase: 04-01
    provides: order-item cost snapshots for sale-time gross profit
provides:
  - monthly sales read model query and service
  - gross profit read model query and service
  - owner reporting routes mounted under /api/reports
affects: [phase 04-08, phase 04-09, ERP reporting UI]

tech-stack:
  added: [none]
  patterns: [SQL views as read models, chi subrouter mount, JSON data wrapper]

key-files:
  created:
    - db/migrations/009_add_reporting_read_models.up.sql
    - db/migrations/009_add_reporting_read_models.down.sql
    - db/queries/reporting.sql
    - internal/reporting/service.go
    - internal/reporting/handler.go
  modified:
    - db/sqlc/reporting.sql.go
    - db/sqlc/models.go
    - db/sqlc/catalog.sql.go
    - internal/reporting/service_test.go
    - cmd/server/main.go
    - .planning/phases/04-erp-management-reporting/deferred-items.md

key-decisions:
  - "Use SQL views for the monthly sales and gross profit read models so the backend exposes stable reporting rows."
  - "Mount reporting under the protected /api router so owner-only access is enforced at the server edge."
  - "Keep money values as satang integers and surface reporting payloads through a consistent {data: ...} JSON envelope."

patterns-established:
  - "Reporting queries live in db/queries/reporting.sql and are regenerated into db/sqlc as part of the backend contract."
  - "HTTP handlers return wrapped JSON data and map the reporting surface to /monthly-sales and /gross-profit."

requirements-completed: [RPT-01, RPT-02]

# Metrics
duration: 8 min
completed: 2026-04-26
---

# Phase 04 Plan 02: Reporting APIs for monthly sales and gross profit Summary

**Monthly sales and gross profit read models are now queryable through owner-only reporting routes backed by sale-time cost snapshots.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-26T03:39:00Z
- **Completed:** 2026-04-26T03:47:24Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Added monthly sales and gross profit SQL read models with generated sqlc types.
- Exposed owner-only `/api/reports/monthly-sales` and `/api/reports/gross-profit` endpoints.
- Verified backend tests pass for reporting service and handler routes.

## Task Commits

1. **Task 1: Implement reporting read models** - `183ca6a` (test)
2. **Task 1: Implement reporting read models** - `3b6dc00` (feat)
3. **Task 2: Mount and verify the reporting routes** - `048a636` (test)
4. **Task 2: Mount and verify the reporting routes** - `caecbfa` (feat)

**Plan metadata:** `caecbfa` (feat: expose reporting routes)

## Files Created/Modified

- `db/migrations/009_add_reporting_read_models.up.sql` - creates reporting read-model views.
- `db/migrations/009_add_reporting_read_models.down.sql` - removes the reporting views.
- `db/queries/reporting.sql` - defines monthly sales and gross profit queries.
- `db/sqlc/reporting.sql.go` - generated query methods for reporting.
- `db/sqlc/models.go` - generated row types for reporting views.
- `db/sqlc/catalog.sql.go` - regenerated category sort-order typing.
- `internal/reporting/service.go` - reporting service wrapper around sqlc queries.
- `internal/reporting/handler.go` - HTTP routes for monthly sales and gross profit.
- `internal/reporting/service_test.go` - service and route tests.
- `cmd/server/main.go` - mounts reporting under `/api/reports`.
- `.planning/phases/04-erp-management-reporting/deferred-items.md` - records unrelated workspace drift left untouched.

## Decisions Made

- Use SQL views as the reporting read models so the backend contract stays stable and easy to query.
- Keep reporting route access owner-only by mounting under the existing protected `/api` router.
- Surface reporting responses as wrapped JSON payloads to match the rest of the backend.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] sqlc CLI was not installed locally**
- **Found during:** Task 1 (Implement reporting read models)
- **Issue:** `sqlc generate` was unavailable in the shell environment.
- **Fix:** Ran `go run github.com/sqlc-dev/sqlc/cmd/sqlc@latest generate` to regenerate the Go code.
- **Files modified:** `db/sqlc/reporting.sql.go`, `db/sqlc/models.go`, `db/sqlc/catalog.sql.go`
- **Verification:** `go test ./internal/reporting ./...` passed.
- **Committed in:** `3b6dc00`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No scope creep; the fix was required to regenerate the backend contract.

## Issues Encountered

- Unrelated frontend and skills workspace drift was present in the repository and intentionally left untouched; it was logged in `deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Reporting APIs are available for the ERP UI to consume.
- Phase 4 reporting dashboard and export work can now build on `/api/reports`.

---
*Phase: 04-erp-management-reporting*
*Completed: 2026-04-26*

## Self-Check: PASSED

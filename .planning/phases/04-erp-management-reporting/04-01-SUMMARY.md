---
phase: 04-erp-management-reporting
plan: 01
subsystem: database
tags: [sales, gross-profit, sqlc, postgres, go]

# Dependency graph
requires:
  - phase: 03-payments-receipts
    provides: completed sales and payment records for reporting
provides:
  - sale-time cost snapshots on order items
  - regression coverage that preserves historical gross-profit cost basis
affects: [04-02-reporting-apis, gross-profit reporting]

# Tech tracking
tech-stack:
  added: [none]
  patterns: [nullable sale-time cost snapshot, sqlc row-based order item reads, regression test for historical cost drift]

key-files:
  created:
    - .planning/phases/04-erp-management-reporting/deferred-items.md
    - internal/sales/service_snapshot_test.go
  modified:
    - db/migrations/008_add_order_item_cost_snapshot.up.sql
    - db/migrations/008_add_order_item_cost_snapshot.down.sql
    - db/queries/sales.sql
    - db/sqlc/models.go
    - db/sqlc/sales.sql.go
    - internal/sales/service.go
    - internal/sales/service_test.go

key-decisions:
  - "Store cost_at_sale as a nullable BIGINT snapshot on order_items so later variant edits do not drift gross profit history."
  - "Snapshot live variant cost during order creation and preserve it in regression tests."

patterns-established:
  - "Order history uses a sale-time cost basis, not the mutable variant cost field."
  - "Regression tests assert snapshot immutability after later catalog edits."

requirements-completed: [RPT-02]

# Metrics
duration: 43 min
completed: 2026-04-26
---

# Phase 04: ERP Management & Reporting Summary

**Sale-item gross-profit stability via immutable cost_at_sale snapshots on orders**

## Performance

- **Duration:** 43 min
- **Started:** 2026-04-26T02:54:00Z
- **Completed:** 2026-04-26T03:37:47Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added nullable `cost_at_sale` storage to order items and wired order creation to snapshot live variant cost.
- Regenerated sqlc output so sales reads/writes include the snapshot column.
- Added regression coverage proving later variant cost edits do not alter stored order history.

## Task Commits

1. **Task 1: Add the order-item cost snapshot** - `n/a` (working-tree changes were already present in the current branch state)
2. **Task 2: Lock in the regression coverage** - `8fe0c1c` (test)

**Plan metadata:** pending

## Files Created/Modified
- `db/migrations/008_add_order_item_cost_snapshot.up.sql` - adds nullable `cost_at_sale`
- `db/migrations/008_add_order_item_cost_snapshot.down.sql` - removes snapshot column
- `db/queries/sales.sql` - writes/reads the snapshot column in order-item queries
- `db/sqlc/models.go` - generated `cost_at_sale` field on order items
- `db/sqlc/sales.sql.go` - generated query bindings for the snapshot column
- `internal/sales/service.go` - snapshots live variant cost during order creation
- `internal/sales/service_test.go` - adjusts sales tests for variant cost lookups
- `internal/sales/service_snapshot_test.go` - regression test for historical cost stability

## Decisions Made
- Snapshot variant cost at sale time instead of reading the mutable variant cost during reporting.
- Keep the snapshot nullable so missing cost data stays representable without inventing a fake zero.

## Deviations from Plan

None - plan executed within scope; unrelated catalog/sqlc failures were deferred.

## Issues Encountered
- `go test ./internal/sales ./...` still fails in unrelated `internal/catalog` / `server` packages because repo-wide sqlc regeneration changed generated catalog row types. Logged in `.planning/phases/04-erp-management-reporting/deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 4 can now compute gross profit from sale-time cost snapshots instead of mutable variant costs.
- Reporting API work can safely aggregate historical profit without drift from later catalog edits.

---
*Phase: 04-erp-management-reporting*
*Completed: 2026-04-26*

## Self-Check: PASSED

---
id: T01
parent: S02
milestone: M001
provides:
  - POST /sales/orders — idempotent order creation with inventory stock deduction
  - GET /sales/orders — list cashier's recent orders
  - sales service (encore.service.ts, datasource.ts, entities.ts, migrations)
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 4min
verification_result: passed
completed_at: 2026-03-28
blocker_discovered: false
---
# T01: 02-pos-frontend-offline 00

**# Phase 2 Plan 00: Sales Service Backend Summary**

## What Happened

# Phase 2 Plan 00: Sales Service Backend Summary

**Idempotent sales order API with delta-based inventory deduction — POST /sales/orders accepts client-generated order_id for offline-safe replay, GET /sales/orders returns cashier's recent orders.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-28T09:46:30Z
- **Completed:** 2026-03-28T09:50:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Sales service scaffold following inventory/ service pattern exactly
- Idempotent order creation via client-generated UUID (OFF-01 compliance)
- Transactional order + items creation (atomic)
- Inventory ledger stock deduction with delta=-quantity per line item (OFF-04 compliance)
- Ledger entry idempotency via client_generated_id={order_id}:{variant_id}

## Task Commits

Each task was committed atomically:

1. **Task 1: Sales service scaffold, schema, and entities** - `99daa45` (feat)
2. **Task 2: Sales API endpoints** - `34184ee` (feat)

**Plan metadata:** `99daa45` (feat: add sales service scaffold) + `34184ee` (feat: add sales API endpoints)

## Files Created/Modified
- `sales/encore.service.ts` — Service("sales") + SQLDatabase("sales", migrations: "./migrations")
- `sales/datasource.ts` — TypeORM DataSource, getDataSource() with Order + OrderItem entities
- `sales/entities.ts` — Order (PrimaryColumn uuid, NOT generated) and OrderItem entities
- `sales/migrations/1_create_sales.up.sql` — orders + order_items tables, CHECK constraint, indexes
- `sales/api.ts` — createOrder (POST /sales/orders) + listOrders (GET /sales/orders)

## Decisions Made

- **Client-generated UUID for idempotency:** Frontend generates order_id as UUID before POST. If POST is retried (offline sync), server returns existing order without side effects.
- **Delta-based stock deduction (OFF-04):** Calls inventory.createLedgerEntry with delta:-quantity (not absolute value). Each ledger entry uses client_generated_id for its own idempotency.
- **Transaction for order+items:** ds.transaction() ensures atomicity of order and line items. Inventory calls are cross-service (outside transaction, idempotent via client_generated_id).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Sales service is operational and ready for Phase 02-05 (offline sync queue)
- POST /sales/orders endpoint available for frontend complete-sale flow
- No blockers

---
*Phase: 02-pos-frontend-offline*
*Completed: 2026-03-28*

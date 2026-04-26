---
phase: 04-erp-management-reporting
plan: 07
subsystem: erp-import
tags: [barcode, csv, xlsx, react, go, chi, sqlc, tanstack-query]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: catalog APIs, auth, and product/variant data model
  - phase: 03-payments-receipts
    provides: phase-wide sales data and THB formatting conventions
provides:
  - variant barcode generation helper
  - ERP spreadsheet import drawer with preview/validation
  - POST /api/catalog/import backend endpoint
affects: [04-06, 04-08, 04-09]

# Tech tracking
tech-stack:
  added: [xlsx]
  patterns: [dialog-based right-side drawer, useMutation submit flow, row-level spreadsheet validation, import endpoint reuse]

key-files:
  created: [frontend/src/lib/erp-api.ts, frontend/src/erp/products/variantBarcode.ts, frontend/src/erp/import/ImportDrawer.tsx, frontend/src/erp/__tests__/erp-import.test.tsx]
  modified: [frontend/package.json, frontend/pnpm-lock.yaml, frontend/src/lib/api.ts, frontend/src/erp/layout/ErpLayout.tsx, frontend/src/routes/erp.index.tsx, internal/catalog/service.go, internal/catalog/handler.go, internal/catalog/handler_test.go, .planning/phases/04-erp-management-reporting/deferred-items.md]

key-decisions:
  - "Use a dedicated ERP drawer for spreadsheet import so validation and submit stay inside the owner workspace."
  - "Parse CSV/XLSX client-side, validate rows before submit, and group variants into product payloads."
  - "Reuse catalog product creation logic behind a dedicated POST /api/catalog/import endpoint."

patterns-established:
  - "Right-side drawer import flows should use a dialog shell, local row validation, and TanStack Query mutation submission."
  - "Variant barcode generation should normalize product/variant names and avoid duplicates within the import batch."

requirements-completed: [PROD-05, PROD-06, PLAT-05]

# Metrics
duration: 12 min
completed: 2026-04-26
---

# Phase 04 Plan 07: Barcode and Spreadsheet Import Summary

**Variant barcode generation and CSV/XLSX bulk import flow with backend persistence.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-26T03:49:30Z
- **Completed:** 2026-04-26T04:01:32Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Added a reusable variant barcode helper with duplicate-safe generation.
- Built an ERP import drawer that parses CSV/XLSX rows, validates them, and submits valid products through TanStack Query.
- Added a backend `/api/catalog/import` endpoint that persists validated products and nested variants.

## Task Commits

1. **Task 1: Implement barcode helpers and import parsing** - `096a152` (feat)
   - Follow-up API wiring commit: `130ba5e` (feat)
2. **Task 2: Add import validation coverage** - `78079d8` (test)

## Files Created/Modified

- `frontend/src/erp/products/variantBarcode.ts` - Generates stable variant barcodes from product and variant names.
- `frontend/src/erp/import/ImportDrawer.tsx` - Spreadsheet import drawer with CSV/XLSX parsing, validation, preview, and submit.
- `frontend/src/lib/erp-api.ts` - ERP-specific import client for `/api/catalog/import`.
- `internal/catalog/service.go` - Bulk import service method reusing existing product/variant creation logic.
- `internal/catalog/handler.go` - Import route and request handling.
- `frontend/src/erp/__tests__/erp-import.test.tsx` - Covers barcode generation, preview, validation, and submission.

## Decisions Made

- Used a dialog-based right-side drawer instead of a separate page to keep import flows inside the ERP shell.
- Added client-side spreadsheet parsing so owners can preview and fix row-level issues before any server write.
- Reused the existing catalog creation path on the backend instead of introducing a separate import schema.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing spreadsheet parser dependency**
- **Found during:** Task 1
- **Issue:** The import drawer needed XLSX parsing but the frontend app did not have a spreadsheet parser installed.
- **Fix:** Added `xlsx` to the frontend dependencies and lockfile.
- **Files modified:** `frontend/package.json`, `frontend/pnpm-lock.yaml`
- **Verification:** ERP import Vitest suite passed.
- **Committed in:** `096a152`

**2. [Rule 3 - Blocking] Hardened spreadsheet file parsing for empty sheets**
- **Found during:** Task 1
- **Issue:** TypeScript flagged possible undefined sheet access when parsing uploaded workbooks.
- **Fix:** Added empty-sheet guards before JSON conversion.
- **Files modified:** `frontend/src/erp/import/ImportDrawer.tsx`
- **Verification:** ERP import Vitest suite passed.
- **Committed in:** `096a152`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Required for the import flow to compile and parse spreadsheets safely; no scope creep.

## Issues Encountered

- `pnpm build` still fails on pre-existing unrelated ERP test imports and missing Vitest globals; these are tracked in `deferred-items.md` and are outside this plan's scope.

## Known Stubs

- `frontend/src/erp/layout/ErpLayout.tsx:36` and `frontend/src/routes/erp.index.tsx:33` still expose a `Create product` CTA without a wired drawer/action; this is intentional and will be handled in the CRUD plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Import flow is ready for product/category CRUD work.
- Barcode generation and row validation are now reusable for the upcoming product editor.

## Self-Check: PASSED

---
*Phase: 04-erp-management-reporting*
*Completed: 2026-04-26*

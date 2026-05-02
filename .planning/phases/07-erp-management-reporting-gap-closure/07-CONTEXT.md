# Phase 07 Context

## Objective
Close the remaining ERP management and reporting verification gaps without adding new v1 capabilities.

## Locked Decisions
- Keep Phase 07 as gap-closure only; re-verify existing ERP behavior rather than redesigning it.
- Preserve the established ERP pattern from Phase 04: desktop-first shell, table-first content, right-side drawers for create/edit flows, dialogs for destructive actions, and tabs for management vs reporting.
- Preserve Product → Variant hierarchy everywhere; do not flatten products.
- Preserve category CRUD and reorder behavior as part of the ERP surface.
- Preserve preview-first spreadsheet import for CSV/XLSX product and variant creation.
- Preserve query-backed reporting with a single merged dashboard for monthly sales and gross profit.
- Preserve the shared THB formatter as the only currency formatting path.
- Preserve jsPDF/autotable for PDF export and SheetJS for XLSX export.
- Keep all fixes constrained to the proven drift surfaced by the regression suite.

## Phase 07 Scope

### Plan 07-01
Re-verify product drawer and product table contracts.
- Editable product form must still normalize existing records.
- Nested variants must keep SKU, barcode, price, cost, and active toggles.
- Product table must keep archive actions and variant archive/reorder actions.
- Barcode generation and THB preview remain wired through the existing drawer contract.

### Plan 07-02
Re-verify category management and catalog import.
- Category drawer must still expose parent-category and description controls.
- Category table must still support create, edit, and reorder actions.
- Import drawer must still parse CSV/XLSX rows, validate before submit, and block invalid or duplicate rows.
- Barcode generation and import payload shape remain aligned with the existing contract.

### Plan 07-03
Re-verify reporting dashboard composition.
- Monthly sales and gross profit must still merge into one dashboard.
- KPI cards, chart, and monthly rows must stay synchronized to the same query result.
- Keep the THB display language and merged-row presentation intact.

### Plan 07-04
Re-verify report export and THB formatting.
- Export buttons must still invoke PDF and XLSX helpers.
- Export filenames must stay range-aware.
- Exported money values must remain formatted as THB.
- Do not introduce a second formatter or export pipeline.

## Canonical Refs
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/REQUIREMENTS.md`
- `.planning/research/SUMMARY.md`
- `.planning/phases/04-erp-management-reporting/VERIFICATION.md`
- `.planning/phases/04-erp-management-reporting/04-RESEARCH.md`

## Deferred Ideas
- No new feature ideas were folded into Phase 07.
- Keep any future ERP enhancements out of this gap-closure phase.

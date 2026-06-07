# ERP Product & Inventory UI Polish

## Goal
Polish the products, categories, and inventory workflows on the ERP dashboard to ensure strict data rules (ledger-derived stock) and a clean desktop user experience (independent modals, clean typography, proper action boundaries).

## Problem Statement
The Products and Inventory features on the ERP dashboard have mixed responsibilities and outdated UI elements:
- The Inventory page displayed a default stock level of zero by not querying ledger deltas.
- Stock adjustments (restocking) were available directly on the Catalog/Product list, violating the rule that catalog owns metadata and inventory owns stock.
- The Category table displayed interactive reorder arrows that were non-functional and out of scope.
- Create/edit forms took over the entire screen or panel, disrupting the backoffice desktop flow.

## Scope & Requirements

### 1. Ledger-Derived Stock Levels
- Fetch and display the current stock level per Variant from the `inventory_ledger` deltas rather than catalog defaults.
- Handle loading, empty, and error states gracefully and distinguish them from an actual zero stock level.

### 2. Dedicated Stock Adjustments
- Remove all stock editing / restocking controls from the Product catalog list.
- Centralize all manual stock adjustments (with required reason codes) on the Inventory page.
- Ensure adjustments are written to the ledger as delta movements (`quantity_change`), not absolute values.

### 3. Desktop Forms as Floating Modals
- Convert Product and Category creation/edit forms into floating, scrollable desktop modals.
- Ensure modal headers and actions remain visible, and long forms scroll independently to prevent off-screen clipping.

### 4. Category Reorder Cleanup
- Remove non-functional up/down arrow controls from the Category management table.
- Ensure remaining actions (e.g., Edit) are fully keyboard and screen-reader accessible.

### 5. Local Issue Tracking Workflow
- Add a GitHub Actions workflow to parse the `Status:` header in `.scratch/**/*.md` files on PR/push, and display a count breakdown in the run summary.

## Non-Goals
- Adding database schema columns for absolute variant stock levels (must remain derived from the ledger).
- Building an automated product category reordering interface.

## Acceptance Criteria
- Owners cannot adjust stock from the Product catalog page.
- Current stock levels on the Inventory page accurately reflect the sum of ledger entries.
- Product/Category forms appear as centered floating modals with scrollable bodies.
- Unused category sort arrows are removed from the Category table.
- The `Local issue progress` GitHub Action successfully runs and reports status summaries.

## Candidate Files
- `frontend/src/erp/inventory/InventoryPage.tsx`
- `frontend/src/erp/products/ProductManagementPage.tsx`
- `frontend/src/erp/tables/ProductTable.tsx`
- `frontend/src/erp/tables/CategoryTable.tsx`
- `frontend/src/erp/products/ProductDrawer.tsx`
- `frontend/src/erp/categories/CategoryDrawer.tsx`
- `.github/workflows/local-issue-progress.yml`

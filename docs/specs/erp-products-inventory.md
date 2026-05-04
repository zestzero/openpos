# ERP Products and Inventory Pages Spec

## Status
Draft

## Purpose
Define the responsibilities, feature boundaries, and acceptance criteria for the ERP `Products` page and `Inventory` page.

## Problem Statement
The ERP workspace needs two distinct experiences:
- A catalog-management surface for maintaining sellable items.
- An inventory-management surface for tracking stock levels and stock movement.

Today these concerns are partially mixed. The spec clarifies the split so UI, API, and workflows stay consistent.

## Definitions
- **Product**: A sellable catalog record.
- **Variant**: A purchasable unit under a product, identified by SKU/barcode and priced independently.
- **Inventory**: The stock ledger and derived stock levels for variants.
- **Ledger entry**: An immutable record of a stock change.

## Scope
### Products Page
The Products page is the catalog editor.

### Inventory Page
The Inventory page is the stock operations and audit surface.

## Requirements
### Products Page
1. Create, edit, and archive products.
2. Create, edit, and archive variants.
3. Assign products to categories.
4. Edit product metadata such as name, description, image, and active state.
5. Edit variant metadata such as SKU, barcode, name, price, cost, and active state.
6. Show current stock level per variant as contextual information.
7. Support restock actions for variants.
8. Support import of products.

### Inventory Page
1. Display current stock level per variant.
2. Display inventory ledger history.
3. Support manual stock adjustments.
4. Require a reason code for every adjustment.
5. Support filtering or lookup by variant, reason, and time range.
6. Expose low-stock and zero-stock states.
7. Treat the ledger as the source of truth for stock changes.

## Non-Goals
1. Do not duplicate full catalog editing controls on the Inventory page.
2. Do not make the Products page the authoritative audit trail for stock changes.
3. Do not replace the ledger with a mutable quantity field.

## UX Principles
1. Products page answers: “What do we sell?”
2. Inventory page answers: “How much do we have, and why did it change?”
3. Catalog actions should stay separate from stock audit actions.

## Data Ownership
- Products page owns product, variant, and category metadata.
- Inventory page owns stock adjustments and ledger visibility.
- Stock level shown on the Products page is derived from inventory data.

## Acceptance Criteria
### Products Page
- A user can manage the catalog without navigating into inventory workflows.
- A user can restock a variant from the product record.
- Stock shown in the catalog reflects the current inventory state.

### Inventory Page
- A user can see stock and stock movement for a variant.
- A user can create a stock adjustment with a reason code.
- The inventory ledger records each adjustment as an immutable event.

## Open Questions
1. Should the Inventory page support negative adjustments for waste, shrink, and sales, or only manual corrections?
2. Should low-stock thresholds be configurable per product, category, or variant?
3. Should the Inventory page support bulk adjustments?

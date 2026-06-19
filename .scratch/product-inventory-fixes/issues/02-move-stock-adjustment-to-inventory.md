Status: ready-for-human

# Move stock adjustment from Product List to Inventory

## What to build

Make Inventory the only ERP workflow for delta stock adjustment. Remove Restock controls from the Product List so catalog management stays focused on Product, Variant, and Category data while Inventory owns Stock Level changes.

## Acceptance criteria

- [ ] Product List no longer shows Restock buttons, menu items, dialogs, labels, or empty actions.
- [ ] Inventory provides the stock adjustment entry point for a selected Variant.
- [ ] Stock adjustments still write Inventory Ledger rows as deltas, not absolute quantities.
- [ ] Product List continues to display read-only Stock Level information when available.
- [ ] Tests verify Product List has no restock action and Inventory can submit a stock adjustment.

## Blocked by

- `.scratch/product-inventory-fixes/issues/01-fix-inventory-ledger-derived-stock-level.md`

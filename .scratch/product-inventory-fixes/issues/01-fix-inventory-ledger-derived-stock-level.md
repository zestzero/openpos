Status: ready-for-human

# Fix ledger-derived Stock Level on Inventory page

## What to build

Ensure the ERP Inventory page displays a Variant's Current Stock from Inventory Ledger deltas instead of falling back to a misleading zero. The page should refresh the displayed Stock Level after stock movements and clearly distinguish actual zero stock from loading, unknown, or error states.

## Acceptance criteria

- [ ] Inventory displays Current Stock as the sum of Inventory Ledger `quantity_change` values for the selected Variant.
- [ ] Creating a ledger-backed stock adjustment updates the displayed Current Stock without requiring a full browser reload.
- [ ] A Variant with ledger movements no longer displays `0` unless the ledger-derived sum is actually zero.
- [ ] Loading, empty, and error states are visually and semantically distinct from an actual zero Stock Level.
- [ ] Relevant backend/frontend tests cover a non-zero ledger-derived Stock Level and an actual zero Stock Level.

## Blocked by

None - can start immediately

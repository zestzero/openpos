# Select products and variants for barcode batch printing

Status: ready-for-human

## Summary
Add selection state and UI affordances on the product page so users can select multiple products and/or variants for batch barcode creation.

## Scope
- Add row selection controls to product rows and variant rows.
- Support selecting multiple items at once.
- Add a visible batch action entry point for barcode generation.
- Keep selection state stable across filtering/sorting where possible.

## Acceptance criteria
- User can select multiple rows without opening edit drawers.
- User can clear the full selection in one action.
- The UI clearly distinguishes product-level and variant-level selections.
- The batch action is disabled when nothing is selected.

## Notes
- If selecting a product implies selecting all active variants, make that behavior explicit in the UI.
- If a product has no active variants, the UI should show a clear fallback or prevent selection.

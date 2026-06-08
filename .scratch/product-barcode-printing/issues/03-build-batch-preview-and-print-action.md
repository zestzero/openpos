# Build barcode batch preview and print action

Status: ready-for-human

## Summary
Create the preview surface that shows selected items and a print action that opens the browser print flow.

## Scope
- Render a batch preview for selected products/variants.
- Show count and item details before printing.
- Add a print button that targets the preview layout.
- Prevent print when no items are selected.

## Acceptance criteria
- Preview reflects the exact selected set.
- Print action produces a clean printable page or print dialog.
- Preview can be closed without losing the selection state.
- User can go back and adjust selection before printing.

## Notes
- Keep the preview component separate from the existing product editing drawers.
- The batch print surface should not block normal product management actions.

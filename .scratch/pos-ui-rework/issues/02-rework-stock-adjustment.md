# Issue: Rework Stock Level Adjustment screen with inline controls

Status: ready-for-agent

## Goal
Implement direct quantity steppers and reason select selectors on the product cards on the Stock Adjustment screen, and consolidate commits into a final confirmation dialog.

## Tasks
1. **Inline controls**:
   - In `pos.inventory.tsx`, render a custom `InventoryProductCard` (or add conditional controls to `ProductCard`) that renders an inline numeric stepper (`-`, input, `+`) and a select dropdown for the adjustment reason.
   - Adjusting these inline values must immediately add/update the item in the local `drafts` state array.
2. **Scanner auto-queueing**:
   - Update barcode scanner callbacks to add/increment variant in `drafts` immediately with reason `RESTOCK`. Show a toast message and highlight the corresponding card.
3. **Commit Confirmation Dialog**:
   - When clicking the main "Commit" button in the sidebar, open a confirmation dialog that shows a summary of all active draft items.
   - Clicking confirm inside this dialog submits all changes to the sync queue.

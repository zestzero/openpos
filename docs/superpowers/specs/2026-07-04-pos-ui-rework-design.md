# POS Selling Floor & Stock Adjustment UI Rework Design

## Goal
Rework the frontend layout of OpenPOS to improve usability for retailers, specifically flattening the nested card-inside-card designs and streamlining the workflows for Cashier Selling Floor and Stock Adjustment.

## Architectural Changes

### 1. POS Selling Floor Rework
*   **Persistent Split Pane**: Update `frontend/src/routes/pos.tsx` and `frontend/src/pos/layout/PosLayout.tsx` to display the product catalog and `CartPanel` side-by-side on all screens of tablet size (`md: 768px`) and up, rather than only on extra-large (`xl: 1280px`) screens.
*   **Unified Cart & Checkout**: Modify `frontend/src/pos/components/CartPanel.tsx` to remove the multi-step navigation sequence (`cart` -> `review` -> `payment`). We will instead place the discount input, payment method triggers (Cash/QR), and payment completion (tendered amount input/QR display) inline inside a scrollable checkout workspace.

### 2. Stock Adjustment Screen Rework
*   **Inline Card Adjustments**: Modify `frontend/src/routes/pos.inventory.tsx` so that cashiers can adjust quantities directly on each product card via an inline stepper (`-` / input / `+`) and a reason select menu (`RESTOCK`, `ADJUSTMENT`, `RETURN`, `DAMAGE`, `LOST`). Editing these fields immediately updates the draft adjustments state list.
*   **Scanner Auto-Queue**: Modify the barcode scanner callbacks to automatically append a `+1` count with the `RESTOCK` reason to the draft list, showing a success toast and highlighting the corresponding product card instead of launching a blocking modal dialog.
*   **Commit Confirmation Dialog**: The main sidebar button ("Commit & Sync") will trigger a final confirmation dialog summarizing all active drafts before writing them to the IndexedDB sync queue.

### 3. Visual Styling Rework (De-nesting)
*   Remove nested `bg-background border rounded-2xl` styling inside outer cards on components like `CartItemRow.tsx` and the sidebar lists in `pos.inventory.tsx`.
*   Replace them with flat, divider-separated list items (`border-b border-gray-100 last:border-0`) to reduce visual density and improve scannability.

## User Interface & Component Details

### `CartPanel.tsx`
*   Current state relies on `step: 'cart' | 'review' | 'payment'`.
*   New state: Single screen containing the cart items list at the top, a collapsible or inline **Checkout Options** section in the middle (Discount & Payment Methods), and a bottom action area showing the Finalize Payment button.
*   Keeps layout simple and prevents layout thrashing during customer checkouts.

### `pos.inventory.tsx`
*   Renders a new component `InventoryProductCard` instead of the default `ProductCard` to handle inline steppers and reason select dropdowns.
*   Maintains a map of `drafts` in local state: `{ [variantId]: { quantity: number, reason: string } }`.
*   Synchronizes card stepper display with the current drafts state.

---

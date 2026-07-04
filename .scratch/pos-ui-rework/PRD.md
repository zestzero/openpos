# PRD: POS Selling Floor & Stock Adjustment UI Rework

## Status: ready-for-agent
**Target**: Improve cashier and retailer UX by removing nested cards, enhancing data density, and streamlining POS selling and inventory flows.

## Core Problem
1. **Low Information Density**: The UI is full of "cards inside cards" leading to large paddings and margins. This forces the cashier to scroll excessively.
2. **Slow Selling Flow**: The Cart panel is hidden behind a dialog on tablet screens, slowing down cashier checkout speed. The checkout flow requires multiple clicks (Cart -> Review -> Payment).
3. **Slow Stock Adjustment Flow**: Clicking a product in the inventory page pops up a dialog just to input a count and select a reason, adding friction to rapid stock adjustments.

## Core Requirements

### 1. Tablet-Friendly Side-by-Side POS Layout
*   Always display the product catalog and `CartPanel` side-by-side on all screens of tablet size (`md: 768px`) and up.
*   Hide the bottom mobile floating cart trigger on screens `md` and larger.

### 2. Single-Screen Checkout Panel
*   Restructure `CartPanel` to combine Cart, Discount (THB), Payment Method triggers (Cash/QR), and Payment Completion fields into a single, unified scrollable panel.

### 3. Inline Stock Adjustments
*   Provide inline numeric inputs (steppers with `-` and `+` buttons) and reason select dropdowns directly on the product cards on the Stock Adjustment screen.
*   Make barcode scanning immediately increment the item count in the drafts array and show a success toast.
*   Consolidate all adjustments into a single confirmation dialog on "Commit & Sync".

### 4. Remove Card Nesting
*   Replace nested card elements inside list components with flat, divider-separated row components.

# Issue: Rework POS Selling Floor Layout & Checkout Flow

Status: ready-for-agent

## Goal
Show Cart and Catalog side-by-side on tablet screens (768px+) and consolidate the multi-step checkout flow into a single-screen panel.

## Tasks
1. **Side-by-Side breakpoint**:
   - In `frontend/src/routes/pos.tsx` and `frontend/src/pos/layout/PosLayout.tsx`, change screen size boundary from `xl` (1280px) to `md` (768px) for rendering the `CartPanel` sidebar and hiding the mobile bottom button.
2. **Unified CartPanel Layout**:
   - Restructure `CartPanel.tsx` to display Cart Items, Discount Input, Payment Method Selection, and Complete Payment button/QR Code on the same screen (scrollable layout).
   - Eliminate transitions through `step: 'cart' | 'review' | 'payment'` and instead render them inline or in simple collapsible sections.

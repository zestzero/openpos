---
id: SEED-001
status: dormant
planted: 2026-05-02
planted_during: v1
trigger_when: when POS cart / checkout flow is revisited, especially if the milestone includes adding items from selling or catalog surfaces into the cart and opening the cart as a sheet/modal before payment
scope: Medium
---

# SEED-001: Add items into cart from selling and catalog, then open cart sheet before payment

## Why This Matters

This closes the gap where the cashier can see products but cannot reliably turn them into an active order flow from both the selling floor and the catalog page.
The seller needs a clear add-to-cart action, then a cart sheet that shows the added items and lets them proceed to payment without losing momentum.

## When to Surface

**Trigger:** when POS cart / checkout flow is revisited, especially if the milestone includes adding items from selling or catalog surfaces into the cart and opening the cart as a sheet/modal before payment

This seed should be presented during `/gsd-new-milestone` when the milestone scope matches any of these conditions:
- cart/checkout flow work in POS
- selling floor or catalog page gains add-to-cart behavior
- checkout is expected to open from a cart sheet, drawer, or modal before payment

## Scope Estimate

**Medium** - this is bigger than a quick fix because it touches multiple POS surfaces and the handoff into payment.

## Breadcrumbs

Related code and decisions found in the current codebase:

- `frontend/src/routes/pos.tsx` - main selling floor with cart anchor and order workspace
- `frontend/src/routes/pos.catalog.tsx` - catalog-only POS route where add-to-cart should also be surfaced
- `frontend/src/pos/components/ProductCard.tsx` - current direct add-to-cart interaction from catalog cards
- `frontend/src/pos/components/SearchBar.tsx` - search-and-add flow that already pushes variants into the cart
- `frontend/src/pos/components/CartPanel.tsx` - checkout workspace with cart/review/payment steps
- `frontend/src/routes/pos.scan.tsx` - scanner lane that currently routes scanned items back toward the cart flow
- `frontend/src/routes/__tests__/pos-shell.test.tsx` - shell regression covering cart anchor and POS surface wiring
- `.planning/ROADMAP.md` - Phase 2 POS scope and cart-related success criteria
- `.planning/REQUIREMENTS.md` - POS-05 through POS-07 and the payment handoff requirements

## Notes

The current POS shell already has cart state, add-to-cart hooks, and a payment flow, but this idea should resurface when the team is explicitly shaping how the cashier opens the cart from selling/catalog interactions and then proceeds into payment.

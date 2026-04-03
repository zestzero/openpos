# T01: 02-pos-frontend-offline 00

**Slice:** S02 — **Milestone:** M001

## Description

Create a minimal Sales service backend that the POS frontend needs to submit and sync orders.

Purpose: Plans 02-03 and 02-05 POST to `/sales/orders` for online sale completion and offline sync. No sales service exists yet. This plan creates the backend endpoint the frontend depends on — minimal order creation with inventory deduction via direct service call to inventory's createLedgerEntry.

Output: Operational Sales service with order creation (idempotent via client-generated UUID), order listing, and automatic stock deduction per line item.

## Must-Haves

- [ ] "POST /sales/orders creates a sale order with line items and returns the order"
- [ ] "POST /sales/orders is idempotent — client-generated order_id prevents duplicates"
- [ ] "Sale creation triggers inventory ledger entries (delta decrement per line item)"
- [ ] "GET /sales/orders returns orders for the authenticated user's store"

## Files

- `sales/encore.service.ts`
- `sales/datasource.ts`
- `sales/entities.ts`
- `sales/api.ts`
- `sales/migrations/1_create_sales.up.sql`

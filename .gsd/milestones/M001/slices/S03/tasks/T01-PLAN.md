# T01: 03-payments-receipts 01

**Slice:** S03 — **Milestone:** M001

## Description

Extend Order entity with payment fields on backend and frontend to support cash and QR payment completion.

Purpose: Phase 3 requires tracking payment method, tendered amount, and change. This plan adds the data model foundation before building payment UI. Backend migration adds SQL columns, frontend IndexedDB adds matching fields.

Output: Order entity supports payment tracking, migration applied, types synchronized frontend↔backend.

## Must-Haves

- [ ] "Order entity has payment_method field (cash, qr, or null)"
- [ ] "Order entity tracks tendered amount and change"
- [ ] "Order entity tracks receipt print status"
- [ ] "IndexedDB schema supports payment fields"

## Files

- `sales/entities.ts`
- `sales/migrations/003_add_payment_fields.up.sql`
- `frontend/src/lib/db.ts`
- `frontend/src/lib/api-client.ts`

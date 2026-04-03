# S03: Payments Receipts

**Goal:** Extend Order entity with payment fields on backend and frontend to support cash and QR payment completion.
**Demo:** Extend Order entity with payment fields on backend and frontend to support cash and QR payment completion.

## Must-Haves


## Tasks

- [ ] **T01: 03-payments-receipts 01**
  - Extend Order entity with payment fields on backend and frontend to support cash and QR payment completion.

Purpose: Phase 3 requires tracking payment method, tendered amount, and change. This plan adds the data model foundation before building payment UI. Backend migration adds SQL columns, frontend IndexedDB adds matching fields.

Output: Order entity supports payment tracking, migration applied, types synchronized frontend↔backend.

## Files Likely Touched

- `sales/entities.ts`
- `sales/migrations/003_add_payment_fields.up.sql`
- `frontend/src/lib/db.ts`
- `frontend/src/lib/api-client.ts`

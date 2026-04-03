# T04: 01-foundation-backend-core 04

**Slice:** S01 — **Milestone:** M001

## Description

Setup the core Inventory service for ledger-based stock management.
Purpose: Create the central inventory system for the POS and ERP.
Output: Operational Inventory service with Ledger, Snapshot, and Stock management endpoints.

## Must-Haves

- [ ] "System records every stock movement in an inventory ledger"
- [ ] "Stock balance is accurately calculated from ledger and snapshots"
- [ ] "Idempotency prevents double-counting stock movements from offline clients"

## Files

- `inventory/encore.service.ts`
- `inventory/migrations/1_create_inventory.up.sql`
- `inventory/entities.ts`
- `inventory/api.ts`

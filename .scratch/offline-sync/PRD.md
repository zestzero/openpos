# Offline Synchronization Layer

Status: needs-triage

## Problem Statement

Salespersons lose sales when internet drops. Shop owner loses transaction records and inventory accuracy. System must record sales offline and sync when online.

## Solution

Offline-first POS sales flow using local IndexedDB (Dexie.js). Queue orders locally with client-generated UUIDs. Sync queue automatically with exponential backoff retry when network reconnects.

## User Stories

1. As a cashier, I want to add items to cart offline, so I can continue selling during outage.
2. As a cashier, I want to checkout and pay offline, so customers do not wait.
3. As a cashier, I want to see offline status indicator, so I know network is down.
4. As a cashier, I want to see pending sync count, so I know how many orders queue locally.
5. As a shop owner, I want offline sales to reconcile automatically, so reporting remains accurate.
6. As a shop owner, I want variant stock to decrement by correct delta upon sync, so inventory stays accurate.

## Implementation Decisions

### Local Database Schema (Dexie.js)
- `variants`: Cache variant catalog (`id`, `sku`, `barcode`, `categoryId`, `updatedAt`).
- `categories`: Cache category catalog (`id`, `name`, `updatedAt`).
- `queuedOrders`: Local queue (`id` as client UUID, `userId`, `status` [pending/syncing/failed], `items` [variantId, quantity, priceSnapshot], `total`, `createdAt`, `retryCount`, `lastError`).
- `syncState`: Sync status tracking (`id`, `lastSyncAt`, `isSyncing`, `pendingCount`).

### Sync Rules & Contract
- Offline orders use client-generated UUIDs for idempotency.
- Sync endpoint: `POST /api/orders/sync`
- Sync payload sends operations: `client_uuid`, `discount_amount`, and items list (`variant_id`, `quantity`, `unit_price`).
- Retry logic: Exponential backoff starting at 2s, doubling per retry up to 60s max. Max 10 retries before permanent failure.

## Testing Decisions

### Test Strategy
- Unit test sync payload serialization and retry delay generation.
- Mock network state changes (online/offline) and verify queue triggers.
- Test client UUID deduplication.

### Prior Art
- `frontend/src/pos/hooks/__tests__/syncContract.test.ts`
- `frontend/src/pos/hooks/__tests__/useBarcodeDetector.test.ts`

## Out of Scope
- Server-to-client delta syncing for catalog (handled via full reload or periodic fetch).
- Split payments offline.
- Real-time stock reservation offline (stock level is speculative when offline).

## Further Notes
- Delta sync is required. Do not send absolute state updates to prevent concurrent overwrite bugs.

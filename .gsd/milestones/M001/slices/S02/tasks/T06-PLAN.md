# T06: 02-pos-frontend-offline 05

**Slice:** S02 — **Milestone:** M001

## Description

Complete the POS experience: favorites/quick-keys bar and offline sale completion with sync queue integration.

Purpose: Cashiers need one-tap access to popular items (POS-06) and the ability to complete sales without internet (OFF-01). Orders created offline are queued and synced automatically with exponential backoff (OFF-02, OFF-03). Stock changes sync as delta operations (OFF-04).

Output: Full POS workflow — browse, scan, add favorites, complete sale online or offline, automatic background sync.

## Must-Haves

- [ ] "Cashier sees favorites bar with quick-add items"
- [ ] "Cashier can complete a sale while offline"
- [ ] "Offline order is saved to IndexedDB with pending_sync status"
- [ ] "Orders sync automatically when connectivity returns"
- [ ] "Sync uses exponential backoff on retry"
- [ ] "Stock changes sync as delta operations (not absolute values)"
- [ ] "Offline status banner shows when device is disconnected"

## Files

- `frontend/src/components/pos/favorites-bar.tsx`
- `frontend/src/stores/favorites-store.ts`
- `frontend/src/components/pos/cart-bottom-sheet.tsx`
- `frontend/src/lib/complete-sale.ts`
- `frontend/src/components/pos/sync-status-indicator.tsx`
- `frontend/src/components/pos/offline-banner.tsx`
- `frontend/src/routes/pos/index.tsx`
- `frontend/src/routes/pos/route.tsx`

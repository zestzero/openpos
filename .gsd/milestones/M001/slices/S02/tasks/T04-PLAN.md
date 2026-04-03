# T04: 02-pos-frontend-offline 03

**Slice:** S02 — **Milestone:** M001

## Description

Set up the offline infrastructure: Dexie.js IndexedDB database, service worker for PWA caching, and sync queue for offline order processing.

Purpose: The POS must work without internet (OFF-01). This plan creates the data layer (Dexie.js tables for products/orders/sync queue), the PWA service worker (PLAT-04), and the sync mechanism with exponential backoff (OFF-02, OFF-03).

Output: Offline database ready for catalog caching and order storage. Service worker registered. Sync queue infrastructure in place.

## Must-Haves

- [ ] "Dexie.js database initializes with products, orders, and syncQueue tables"
- [ ] "Service worker caches app shell for offline loading"
- [ ] "Sync queue stores offline orders with status tracking"
- [ ] "Online/offline status is reactive and available via hook"

## Files

- `frontend/src/lib/db.ts`
- `frontend/src/lib/sync-queue.ts`
- `frontend/src/hooks/use-online-status.ts`
- `frontend/public/sw.js`
- `frontend/src/lib/register-sw.ts`
- `frontend/src/main.tsx`
- `frontend/package.json`

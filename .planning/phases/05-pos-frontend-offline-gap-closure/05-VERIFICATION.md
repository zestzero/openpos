---
phase: 05-pos-frontend-offline-gap-closure
verified: 2026-05-02T03:33:59Z
status: human_needed
score: 6/6 must-haves verified
human_verification:
  - test: "Run an offline checkout, then reconnect"
    expected: "Queued orders stay tied to the same client_uuid and sync after connectivity returns without duplication"
    why_human: "Requires live network transitions and timing behavior"
  - test: "Open the POS shell on mobile width and navigate selling, catalog, and scan routes"
    expected: "Quick keys, cart anchor, catalog grid, and scanner lane remain visible and usable"
    why_human: "Responsive layout and interactive flow need manual confirmation"
---

# Phase 05: POS Frontend Offline Gap Closure Verification Report

**Phase Goal:** Close the offline POS wiring gaps so queued sales, sync retries, and sync contracts are verified end-to-end.
**Verified:** 2026-05-02T03:33:59Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Queued offline orders are serialized with the backend's client_uuid sync contract | ✓ VERIFIED | `syncContract.ts` maps `client_uuid`, `variant_id`, and `unit_price`; vitest passes |
| 2 | Failed syncs keep the correct queued order in the retry queue | ✓ VERIFIED | `useSync.ts` indexes errors by `client_uuid`; matching queued orders stay retryable; vitest + build pass |
| 3 | Pending and syncing counts in Dexie match the actual queued-order statuses | ✓ VERIFIED | `deriveSyncSnapshot()` recomputes counts from rows and `useOfflineOrders.ts` refreshes sync state after queue mutations |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `frontend/src/pos/hooks/syncContract.ts` | Shared offline sync contract helpers | ✓ VERIFIED | Exports payload mapping, error lookup, snapshot derivation, retry delay |
| `frontend/src/pos/hooks/useOfflineOrders.ts` | Dexie queue + sync-state updates | ✓ VERIFIED | Recomputes sync state from live Dexie rows after add/update/delete |
| `frontend/src/pos/hooks/useSync.ts` | Batch sync and retry flow | ✓ VERIFIED | Uses shared helpers and preserves queued IDs through sync failures |
| `frontend/src/pos/__tests__/syncContract.test.ts` | Regression coverage for sync payloads and retry math | ✓ VERIFIED | Vitest suite passes |
| `frontend/src/routes/pos.tsx` | Main cashier floor route | ✓ VERIFIED | Exports `PosRoute`, renders `QuickKeysBar`, cart panel, and shell wrapper |
| `frontend/src/routes/pos.catalog.tsx` | Catalog browsing route | ✓ VERIFIED | Exports `PosCatalogRoute` and renders catalog grid |
| `frontend/src/routes/pos.scan.tsx` | Barcode scanning route | ✓ VERIFIED | Exports `ScanPage` with scanner lane and wedge controls |
| `frontend/src/pos/layout/PosLayout.tsx` | Shared mobile-first shell | ✓ VERIFIED | Uses shared `useNetworkStatus()` and renders `OfflineBanner` |
| `frontend/src/routes/__tests__/pos-shell.test.tsx` | POS shell smoke coverage | ✓ VERIFIED | Smoke test renders selling, catalog, and scan surfaces |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `frontend/src/pos/hooks/useSync.ts` | `frontend/src/pos/hooks/syncContract.ts` | `buildSyncOrdersRequest`, `collectFailedClientUUIDs`, `getNextRetryDelayMs` | WIRED | Shared contract is imported and used in sync flow |
| `frontend/src/pos/hooks/useOfflineOrders.ts` | `frontend/src/pos/hooks/syncContract.ts` | `deriveSyncSnapshot` | WIRED | Sync counters are derived from current Dexie rows |
| `frontend/src/routes/pos.tsx` | `frontend/src/pos/layout/PosLayout.tsx` | shared shell wrapper | WIRED | `PosRoute` renders inside `PosLayout` |
| `frontend/src/routes/pos.catalog.tsx` | `frontend/src/pos/components/CatalogGrid.tsx` | catalog browsing pane | WIRED | Catalog route renders the grid directly |
| `frontend/src/routes/pos.scan.tsx` | `frontend/src/pos/components/BarcodeScanner.tsx` | scanner lane | WIRED | Scan page renders camera scanner UI |
| `frontend/src/pos/layout/PosLayout.tsx` | `frontend/src/pos/components/OfflineBanner.tsx` | offline banner above main content | WIRED | Shell shows offline banner from shared network status |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| POS-01, POS-02, POS-03, POS-04, POS-05, POS-06, POS-07, PLAT-01 | 05-02 | Mobile POS shell, route separation, scan/catalog/search/cart/quick-key surfaces | SATISFIED | Route exports + smoke test cover the shell surfaces; frontend build passes |
| OFF-01, OFF-02, OFF-03, OFF-04 | 05-01 | Offline completion, queue sync, exponential retry, delta stock sync contract | SATISFIED | Shared sync contract + Dexie-backed state updates + targeted vitest pass |
| PLAT-04 | 05-02 | PWA service worker registration | SATISFIED | `frontend/src/main.tsx` registers `/sw.js` |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| None blocking in phase files | — | — | Info | Automated tests and production build both succeed |

### Human Verification Required

1. **Offline checkout retry**
   - **Test:** Create a queued order offline, reconnect, and watch the sync retry loop.
   - **Expected:** The order remains tied to the same client_uuid and syncs once connectivity returns.
   - **Why human:** Requires live network transitions and timing behavior.

2. **Cashier shell flow**
   - **Test:** Open the POS shell on a mobile viewport and move through selling, catalog, and scan routes.
   - **Expected:** Quick keys, cart anchor, catalog grid, and scanner lane remain visible and usable.
   - **Why human:** Responsive layout and real interaction need manual confirmation.

### Gaps Summary

No blocking code gaps found. Automated verification passed, but live offline retry behavior and cashier-flow usability still need manual confirmation.

---

_Verified: 2026-05-02T03:33:59Z_
_Verifier: the agent (gsd-verifier)_

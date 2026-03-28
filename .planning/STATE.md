---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-28T11:01:50Z"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 10
  completed_plans: 11
---

# STATE.md

**Project:** OpenPOS
**Milestone:** v1
**Core Value:** A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.

---

## Current Position

Phase: 02 (pos-frontend-offline) — COMPLETE
Plan: 6 of 6 (all complete)

## Phase Overview

| Phase | Goal | Status |
|-------|------|--------|
| 1 | Foundation & Backend Core | ✅ Complete |
| 2 | POS Frontend & Offline | ✅ Complete |
| 3 | Payments & Receipts | Not started |
| 4 | ERP Management & Reporting | Not started |

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Encore TypeScript backend | Infrastructure-as-code, type-safe services, auto-provisioned DB/PubSub |
| TypeORM (hybrid approach) | Entities define schema; Encore runs SQL migrations |
| Single SPA (route-separated) | Shared auth/components, POS routes mobile-optimized, ERP desktop-optimized |
| Vite + React | No SSR needed, lighter than Next.js, better PWA support |
| PWA for offline POS | Service workers + IndexedDB, avoids React Native complexity |
| Service-per-domain | Auth, Catalog, Inventory, Sales, Reporting — independent databases |
| Product → Variant hierarchy | Never flat products; variants have own SKU/barcode/price/cost |
| Inventory ledger + snapshot | Ledger is truth, snapshot is derived cache |
| Delta sync for offline | Sync operations (decrement 1), not state (set to 9) |
| Tailwind v4 CSS-first | @theme in globals.css instead of v3 JS config |
| Sonner replaces toast | shadcn deprecated toast, sonner is the replacement |
| Router plugin order | tanstackRouter plugin must precede react() in vite.config.ts |
| JWT via atob() | Parse JWT payload with atob() on base64url segment — no extra lib needed |
| THB via Intl.NumberFormat | formatTHB(priceCents) = Intl.NumberFormat('th-TH', { currency: 'THB' }).format(priceCents/100) |
| CategoryTabs custom buttons | Custom pill buttons over shadcn Tabs for better horizontal scroll control |
| Dexie.js EntityTable | Typed IndexedDB via Dexie EntityTable — db.categories/products/variants/orders/syncQueue |
| Exponential backoff sync | 1s, 2s, 4s, 8s, 16s backoff — max 5 attempts for offline order sync |
| Delta sync (operations not state) | POST CREATE_ORDER operations (item decrements), not absolute stock values |
| Client-side UUIDs for orders | Offline orders use client-generated UUIDs — server never assigns IDs |
| Sequential sync processing | Sync queue processes one entry at a time for server-side order consistency |
| Hand-written service worker | Cache-first static assets, network-first navigation, SPA fallback — focused scope |
| variantToProductName reverse lookup | ProductTile passes VariantResponse only; POS builds {variantId→productName} map from displayProducts×variantsByProduct to attach product name to cart items |
| BarcodeDetector with any-cast | Native BarcodeDetector API not in standard TS lib; uses `window as any`, graceful html5-qrcode fallback |

---

## Research Flags

| Phase | Flag | Action |
|-------|------|--------|
| 2 | BarcodeDetector API performance | Validate if scanning speed issues arise |
| 2 | Dexie.js + TanStack Query integration | Community patterns, possible cache invalidation complexity |
| 3 | Thai QR PromptPay gateway API | Research specific payment provider before Phase 3 |
| 4 | Report export formats | Research PDF/Excel generation libraries |

---

*Last updated: 2026-03-28 (Plan 02-05 complete — favorites bar, offline sale completion, sync status indicator, offline banner. Phase 02 COMPLETE.)*

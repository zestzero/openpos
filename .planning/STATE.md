---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-23T14:55:11.658Z"
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 4
  completed_plans: 1
---

# STATE.md

**Project:** OpenPOS
**Milestone:** v1
**Core Value:** A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.

---

## Current Position

Phase: 01 (foundation-backend-core) — EXECUTING
Plan: 2 of 4

## Phase Overview

| Phase | Goal | Status |
|-------|------|--------|
| 1 | Foundation & Backend Core | Not started |
| 2 | POS Frontend & Offline | Not started |
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

---

## Research Flags

| Phase | Flag | Action |
|-------|------|--------|
| 2 | BarcodeDetector API performance | Validate if scanning speed issues arise |
| 2 | Dexie.js + TanStack Query integration | Community patterns, possible cache invalidation complexity |
| 3 | Thai QR PromptPay gateway API | Research specific payment provider before Phase 3 |
| 4 | Report export formats | Research PDF/Excel generation libraries |

---

*Last updated: 2026-03-22*

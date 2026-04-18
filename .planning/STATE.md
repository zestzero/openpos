---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: not_started
last_updated: "2026-04-18"
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# STATE.md

**Project:** OpenPOS
**Milestone:** v1
**Core Value:** A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.
**Stack Reset:** 2026-04-18 — migrated from Encore TypeScript to Go (chi + sqlc + pgx). Full reset.

---

## Current Position

Phase: 1
Plan: Not started

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
| Go backend (chi + sqlc + pgx) | Simple, fast, single binary deployment, SQL-first data access with type safety |
| sqlc over GORM | SQL-first — write queries in SQL, get type-safe Go code; more idiomatic Go |
| Monolithic Go binary | Clean package boundaries per domain, in-process communication, simpler than microservices |
| Docker self-host | Single container, no vendor lock-in, runs on VPS/VM/k8s |
| Single SPA (route-separated) | Shared auth/components, POS routes mobile-optimized, ERP desktop-optimized |
| Vite + React | No SSR needed, lighter than Next.js, better PWA support |
| PWA for offline POS | Service workers + IndexedDB, avoids React Native complexity |
| Product → Variant hierarchy | Never flat products; variants have own SKU/barcode/price/cost |
| Inventory ledger + snapshot | Ledger is truth, snapshot is derived cache |
| Delta sync for offline | Sync operations (decrement 1), not state (set to 9) |

---

## Research Flags

| Phase | Flag | Action |
|-------|------|--------|
| 1 | sqlc + pgx patterns for POS domain | Research during Phase 1 planning |
| 2 | BarcodeDetector API performance | Validate if scanning speed issues arise |
| 3 | Thai QR PromptPay gateway API | Research specific payment provider before Phase 3 |
| 4 | Report export formats | Research PDF/Excel generation libraries |

---

*Last updated: 2026-04-18 — full reset for Go stack migration*

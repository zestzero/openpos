---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 02-01-PLAN.md
last_updated: "2026-04-25T15:06:19.455Z"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 9
  completed_plans: 5
---

# STATE.md

**Project:** OpenPOS
**Milestone:** v1
**Core Value:** A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.
**Stack Reset:** 2026-04-18 — migrated from Encore TypeScript to Go (chi + sqlc + pgx). Full reset.

---

## Current Position

Phase: 02 (pos-frontend-offline) — EXECUTING
Plan: 2 of 5

## Phase Overview

| Phase | Goal | Status |
|-------|------|--------|
| 1 | Foundation & Backend Core | Complete |
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
| pgtype.UUID with .String() | UUID conversion uses pgtype.UUID.String() method for string representation |
| SKU/barcode validation in service | Unique constraints enforced at service layer before DB for better error messages |

---

## Decisions

- Use TanStack Router with file-scaffolded route modules and a generated route tree to keep POS and ERP route-separated.
- Persist JWTs and cached user payloads in localStorage so the session can bootstrap instantly after refresh.
- Keep the POS shell mobile-first with a fixed header, bottom navigation, and thumb-reach primary actions.
- Ship a lightweight manifest plus service worker so the frontend app shell is installable and cacheable offline.

## Research Flags

| Phase | Flag | Action |
|-------|------|--------|
| 1 | sqlc + pgx patterns for POS domain | Research during Phase 1 planning |
| 2 | BarcodeDetector API performance | Validate if scanning speed issues arise |
| 3 | Thai QR PromptPay gateway API | Research specific payment provider before Phase 3 |
| 4 | Report export formats | Research PDF/Excel generation libraries |

---

*Last updated: 2026-04-25 — completed plan 01-04 (inventory ledger)*

---

## Session Continuity

Last session: 2026-04-25T15:06:19.453Z
Stopped at: Completed 02-01-PLAN.md
Resume file: None

---

## Performance Metrics

| Run | Duration | Tasks | Files |
|-----|----------|-------|-------|
| Phase 02 P01 | 8m | 3 tasks | 27 files |

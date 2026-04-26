---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 04-07-PLAN.md
last_updated: "2026-04-26T04:02:34.059Z"
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 19
  completed_plans: 12
---

# STATE.md

**Project:** OpenPOS
**Milestone:** v1
**Core Value:** A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.
**Stack Reset:** 2026-04-18 — migrated from Encore TypeScript to Go (chi + sqlc + pgx). Full reset.

---

## Current Position

Phase: 04 (erp-management-reporting) — EXECUTING
Plan: 6 of 9

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
- [Phase 04-erp-management-reporting]: Use a dedicated Vitest config with jsdom so ERP tests stay isolated from app build settings.
- [Phase 04-erp-management-reporting]: Centralize DOM matcher and cleanup setup in frontend/src/test/setup.ts for all ERP specs.
- [Phase 04-erp-management-reporting]: Anchor the smoke test on the shared THB formatter to keep monetary display behavior covered.
- [Phase 04-erp-management-reporting]: Categories persist sort_order in the database so ERP list ordering stays stable across refreshes.
- [Phase 04-erp-management-reporting]: Category reordering uses a dedicated PUT /categories/reorder endpoint with handler-side payload validation.
- [Phase 04]: Snapshot live variant cost during order creation and preserve it with regression tests.
- [Phase 04-erp-management-reporting]: Kept the ERP route owner-gated and composed it with an outlet-based shell.
- [Phase 04-erp-management-reporting]: Used a fixed left nav, top utility bar, and tab strip to match the desktop ERP contract.
- [Phase 04-erp-management-reporting]: Covered the owner guard and shell with a focused Vitest suite.
- [Phase 04-erp-management-reporting]: Use SQL views for the monthly sales and gross profit read models so the backend exposes stable reporting rows.
- [Phase 04-erp-management-reporting]: Mount reporting under the protected /api router so owner-only access is enforced at the server edge.
- [Phase 04-erp-management-reporting]: Keep money values as satang integers and surface reporting payloads through a consistent {data: ...} JSON envelope.
- [Phase 04-erp-management-reporting]: Use a dedicated ERP drawer for spreadsheet import so validation and submit stay inside the owner workspace.
- [Phase 04-erp-management-reporting]: Parse CSV/XLSX client-side, validate rows before submit, and group variants into product payloads.
- [Phase 04-erp-management-reporting]: Reuse catalog product creation logic behind a dedicated POST /api/catalog/import endpoint.

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

Last session: 2026-04-26T04:02:34.057Z
Stopped at: Completed 04-07-PLAN.md
Resume file: None

---

## Performance Metrics

| Run | Duration | Tasks | Files |
|-----|----------|-------|-------|
| Phase 02 P01 | 8m | 3 tasks | 27 files |
| Phase 04-erp-management-reporting P04 | 5 min | 1 tasks | 5 files |
| Phase 04-erp-management-reporting P05 | 10 min | 2 tasks | 7 files |
| Phase 04-erp-management-reporting P02 | 8 min | 2 tasks | 11 files |
| Phase 04-erp-management-reporting P07 | 12 min | 2 tasks | 10 files |

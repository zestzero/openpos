---
phase: 02-pos-frontend-offline
plan: "02"
subsystem: ui
tags: [tanstack-query, auth, api-client, catalog, pos, typescript]

# Dependency graph
requires:
  - phase: "01-foundation-backend-core"
    provides: "REST APIs: /auth/pin-login, /auth/login, /catalog/categories, /catalog/products, /catalog/products/:id/variants"
  - phase: "02-foundation-backend-core"
    provides: "Frontend scaffold (plan 02-01): Vite + React + TanStack Router + shadcn/ui"
provides:
  - "API client with JWT Bearer auth wrapping all catalog endpoints"
  - "Auth context with PIN/email login and localStorage token persistence"
  - "TanStack Query hooks for categories, products, search, variants"
  - "THB price formatting via Intl.NumberFormat"
  - "POS catalog browsing UI: search bar, category tabs, product grid"
affects:
  - "02-03 (offline database with Dexie.js — uses api-client and use-catalog hooks)"
  - "02-04 (cart management — uses auth context and POS UI components)"
  - "02-05 (favorites + offline sale completion — uses catalog hooks)"

# Tech tracking
tech-stack:
  added:
    - "@tanstack/react-query ^5.70.0"
    - "zustand ^5.0.0"
  patterns:
    - "JWT Bearer token stored in module-level variable + localStorage"
    - "TanStack Query with 5-min staleTime for catalog data"
    - "THB formatting via Intl.NumberFormat('th-TH', { currency: 'THB' })"
    - "Product grid: 2-col mobile / 3-col tablet / 4-col desktop responsive"

key-files:
  created:
    - "frontend/src/lib/api-client.ts — typed fetch wrapper, CategoryResponse/ProductResponse/VariantResponse types, auth token management"
    - "frontend/src/lib/auth.tsx — AuthProvider, useAuth hook, PIN + email login, localStorage persistence"
    - "frontend/src/lib/query-client.ts — QueryClient with 5-min staleTime"
    - "frontend/src/lib/format.ts — formatTHB(priceCents)"
    - "frontend/src/hooks/use-catalog.ts — useCategories, useProducts, useSearchProducts, useVariants"
    - "frontend/src/components/pos/search-bar.tsx — sticky search input + scan button"
    - "frontend/src/components/pos/category-tabs.tsx — horizontal scrollable category filter with All default"
    - "frontend/src/components/pos/product-tile.tsx — touch card with name + THB price"
    - "frontend/src/components/pos/product-grid.tsx — responsive grid with loading skeleton + empty state"
  modified:
    - "frontend/src/main.tsx — added QueryClientProvider + AuthProvider wrapping RouterProvider"
    - "frontend/package.json — added @tanstack/react-query and zustand"
    - "frontend/src/routes/pos/index.tsx — replaced placeholder with full POS screen composing all components"

key-decisions:
  - "JWT parse via atob() on base64url payload — matching Encore's jwt library output"
  - "Price cents → THB: divide by 100 then Intl.NumberFormat — consistent with backend price_cents convention"
  - "Category tabs use custom button implementation (not shadcn Tabs) — better control over pill styling and horizontal scroll"
  - "Search activates at 2+ characters — avoids over-fetching single-char searches"

requirements-completed: [POS-03, POS-04]

# Metrics
duration: 45s
completed: 2026-03-28
---

# Phase 02 Plan 02 Summary

**API client wired to Encore backend with JWT Bearer auth, TanStack Query data fetching, and POS catalog browsing UI (category tabs, product grid, search).**

## One-liner

JWT-authenticated TanStack Query hooks wrapping catalog API endpoints, connected to a mobile-first POS screen with search and category filtering.

## Accomplishments

- API client (`api-client.ts`) typed to match all Encore backend endpoints: `/auth/pin-login`, `/auth/login`, `/catalog/categories`, `/catalog/products`, `/catalog/products/:id/variants`
- Auth context with JWT token persistence in localStorage, PIN login, and email/password login
- TanStack Query hooks: `useCategories`, `useProducts`, `useSearchProducts`, `useVariants` with 5-min staleTime
- THB price formatting via `Intl.NumberFormat('th-TH', { currency: 'THB' })` — ฿25.00 format
- POS screen: sticky search bar (D-03), horizontal scrollable category tabs with "All" default, responsive product grid (2-col / 3-col / 4-col)
- Product tiles show name, THB price, and multi-variant "from ฿X.XX" pricing
- `pb-20` on scrollable area leaves room for cart bottom bar (Plan 04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create API client, auth context, TanStack Query setup** — `cfc03f0`
2. **Task 2: Build catalog browsing UI** — `a8b202f`

## Files Created/Modified (12 files)

**Task 1 (7 files):**
- `frontend/src/lib/api-client.ts` — fetch wrapper with Bearer auth, all catalog endpoint functions, TypeScript response interfaces
- `frontend/src/lib/auth.tsx` — AuthProvider + useAuth with JWT parse, localStorage persistence, login methods
- `frontend/src/lib/query-client.ts` — QueryClient (5-min staleTime, retry 1)
- `frontend/src/lib/format.ts` — formatTHB()
- `frontend/src/hooks/use-catalog.ts` — 4 TanStack Query hooks
- `frontend/src/main.tsx` — QueryClientProvider + AuthProvider wrapping RouterProvider
- `frontend/package.json` — @tanstack/react-query + zustand

**Task 2 (5 files):**
- `frontend/src/components/pos/search-bar.tsx` — sticky search + scan button (D-03)
- `frontend/src/components/pos/category-tabs.tsx` — horizontal scrollable pill tabs
- `frontend/src/components/pos/product-tile.tsx` — touch card with formatTHB price
- `frontend/src/components/pos/product-grid.tsx` — responsive grid with skeleton + empty state
- `frontend/src/routes/pos/index.tsx` — full POS screen composing all components

## Decisions Made

- **JWT parsing via atob():** Encore's `jose` library outputs standard base64url JWT; `atob()` on the middle segment correctly parses the payload without additional libraries
- **CategoryTabs custom buttons vs shadcn Tabs:** Custom button implementation gives better control over pill styling and horizontal scroll behavior required by D-02/D-03
- **Search threshold at 2 chars:** Avoids API over-fetching for single-character inputs

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — no blocking issues. All acceptance criteria met on first build.

## Known Stubs

| File | Line | Stub | Reason |
|------|------|------|--------|
| `frontend/src/routes/pos/index.tsx` | 48 | `onScanPress={() => {}}` | Barcode scanner modal deferred to Plan 04 |
| `frontend/src/components/pos/product-tile.tsx` | 30 | Multi-variant selection | Variant picker modal deferred to Plan 04 |

These stubs are intentional per plan scope — Plan 04 adds barcode scanning and variant selection.

## Verification

- `cd frontend && npx vite build` exits 0 ✓
- `grep "Bearer" frontend/src/lib/api-client.ts` → Authorization header set ✓
- `grep "formatTHB" frontend/src/components/pos/product-tile.tsx` → THB formatting ✓
- `grep "useCategories\|useProducts\|useSearchProducts" frontend/src/routes/pos/index.tsx` → All hooks used ✓

## Next Phase Readiness

- `api-client.ts` ready for Plan 03 (offline Dexie.js sync will wrap these same endpoints)
- `use-catalog.ts` hooks ready for Plan 05 (favorites bar will use useProducts)
- `AuthProvider` in place for Plan 04 cart checkout (requires authenticated user)
- POS screen layout complete — Plan 04 only needs to add cart bottom sheet and scan modal

---
*Phase: 02-pos-frontend-offline / Plan 02*
*Completed: 2026-03-28*

---
phase: 02-pos-frontend-offline
plan: 01
subsystem: frontend
tags: [vite, react, tanstack-router, tanstack-query, tailwindcss, shadcn-ui, pwa, jwt]

# Dependency graph
requires:
  - phase: 01-foundation-backend-core
    provides: auth endpoints, catalog endpoints, inventory endpoints, JWT middleware, and DB-backed user roles
provides:
  - Vite + React + TypeScript frontend foundation
  - TanStack Router file-scaffold with auth redirects and role-based routing
  - TanStack Query provider and JWT session persistence helpers
  - PWA shell metadata plus service worker caching for the app shell
  - Mobile-first POS layout shell with header, bottom nav, and THB formatting
affects: [02-pos-frontend-offline, 03-payments-receipts, 04-erp-management-reporting]

# Tech tracking
tech-stack:
  added: [@tanstack/react-router, @tanstack/react-query, @tanstack/router-plugin, @tanstack/react-router-devtools, tailwindcss v4, @tailwindcss/vite, lucide-react, dexie]
  patterns: [file-based routing, localStorage JWT session cache, route-guard redirects, mobile-first POS shell, service-worker app-shell caching]

key-files:
  created: [frontend/src/routes/__root.tsx, frontend/src/routes/index.tsx, frontend/src/routes/login.tsx, frontend/src/routes/pos.tsx, frontend/src/routes/erp.tsx, frontend/src/routeTree.gen.ts, frontend/src/lib/api.ts, frontend/src/lib/auth.ts, frontend/src/lib/utils.ts, frontend/src/hooks/useAuth.ts, frontend/src/components/ui/button.tsx, frontend/src/components/ui/input.tsx, frontend/src/components/ui/card.tsx, frontend/src/components/ui/dialog.tsx, frontend/public/manifest.webmanifest, frontend/public/sw.js, frontend/src/pos/layout/PosLayout.tsx, frontend/src/pos/components/PosHeader.tsx, frontend/src/pos/components/PosNav.tsx, frontend/src/lib/formatCurrency.ts]
  modified: [frontend/package.json, frontend/vite.config.ts, frontend/tsconfig.json, frontend/tsconfig.app.json, frontend/tsconfig.node.json, frontend/index.html, frontend/src/main.tsx, frontend/src/app.css, frontend/src/App.tsx]

key-decisions:
  - "Use TanStack Router with file-scaffolded route modules and a generated route tree so the POS/ERP shell stays route-separated."
  - "Persist JWTs in localStorage and seed session state from the cached user payload to avoid login flicker after refresh."
  - "Make the POS shell mobile-first with a fixed header, bottom navigation, and thumb-reach primary actions."
  - "Add a lightweight service worker and manifest so the app shell remains installable and cacheable offline."

patterns-established:
  - "Pattern 1: Auth guards redirect unauthenticated users to /login and owners/cashiers to their correct landing route."
  - "Pattern 2: Currency formatting is centralized in a satang-to-THB helper using Intl.NumberFormat."

requirements-completed: [POS-01, POS-02, POS-03, POS-04, POS-05, POS-06, POS-07, OFF-01, OFF-02, OFF-03, OFF-04, PLAT-01, PLAT-04]

# Metrics
duration: 8m
completed: 2026-04-25
---

# Phase 2: POS Frontend & Offline Summary

**Vite React POS shell with JWT session persistence, TanStack Router guards, and a mobile cashier layout.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-25T14:54:00Z
- **Completed:** 2026-04-25T15:02:46Z
- **Tasks:** 3
- **Files modified:** 27

## Accomplishments
- Bootstrapped a production-ready Vite + React frontend foundation with mobile kiosk viewport and PWA metadata.
- Wired TanStack Router, TanStack Query, JWT session persistence, and role-based route redirects for POS vs ERP access.
- Built the cashier-facing mobile POS shell with fixed header, bottom navigation, and a THB formatter for satang values.

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Frontend Project** - `dfa5c8a` (feat)
2. **Task 2: Initialize shadcn/ui + TanStack Router + TanStack Query** - `e20f9f6` (feat)
3. **Task 3: Auth Session, Route Guards, and POS Layout Shell** - `f5b192d` (feat)

## Files Created/Modified
- `frontend/src/main.tsx` - Router provider + query client entrypoint
- `frontend/src/routes/__root.tsx` - Root guard and devtools host
- `frontend/src/routes/login.tsx` - Email/password and PIN login form
- `frontend/src/routes/pos.tsx` - Cashier route shell
- `frontend/src/pos/layout/PosLayout.tsx` - Mobile POS workspace shell
- `frontend/src/lib/auth.ts` - JWT/session helpers
- `frontend/src/lib/api.ts` - Bearer-auth fetch client and backend contracts
- `frontend/src/lib/formatCurrency.ts` - Satang to THB formatter
- `frontend/public/sw.js` - App-shell caching service worker

## Decisions Made
- Kept the POS and ERP surfaces route-separated from the first frontend release.
- Stored session state locally and decoded JWT claims for fast auth bootstrap after refresh.
- Added a standalone service worker/manifest pair instead of waiting for later offline work so the shell is installable now.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript 6 deprecation on `baseUrl` broke the build**
- **Found during:** Task 1 (frontend scaffold)
- **Issue:** `tsc -b` failed because `baseUrl` is now deprecated under TypeScript 6.
- **Fix:** Added `ignoreDeprecations: "6.0"` to the frontend TS configs.
- **Files modified:** `frontend/tsconfig.json`, `frontend/tsconfig.app.json`
- **Verification:** `cd frontend && npm run build` passed
- **Committed in:** `dfa5c8a`

### Total deviations

- **1 auto-fixed** (Rule 3 blocking)
- **Impact:** Required for a successful build; no scope creep.

## Known Stubs

- `frontend/src/routes/erp.tsx` — owner dashboard is an intentional placeholder until the ERP phase.

## Issues Encountered

- TanStack Router files were scaffolded manually to keep the route tree type-checkable during the build step.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- POS auth shell is ready for catalog/cart/sync work in the next phase tasks.
- ERP route remains intentionally minimal until the owner-facing phase.

---
*Phase: 02-pos-frontend-offline*
*Completed: 2026-04-25*

## Self-Check: PASSED

- Summary file exists.
- Task commits found: `dfa5c8a`, `e20f9f6`, `f5b192d`.

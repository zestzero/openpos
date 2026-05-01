# Codebase Concerns

**Analysis Date:** 2026-05-02

## Tech Debt

**Backend role enforcement lives in the UI only:**
- Issue: owner/cashier separation is enforced in `frontend/src/routes/erp.tsx`, but `cmd/server/main.go` never applies `internal/middleware/auth.go:RequireRole` to any API route.
- Files: `cmd/server/main.go`, `internal/middleware/auth.go`, `frontend/src/routes/erp.tsx`
- Impact: any authenticated cashier can call ERP/catalog/inventory/reporting endpoints directly.
- Fix approach: mount role-guarded routers on the backend and treat frontend route guards as convenience only.

**Startup continues after critical initialization failures:**
- Issue: `cmd/server/main.go` logs migration and database connection errors, then keeps booting.
- Files: `cmd/server/main.go`, `internal/database/db.go`
- Impact: the server can start with unapplied migrations or a nil DB pool, which turns outages into runtime panics or partial behavior.
- Fix approach: fail fast on migration/connect errors and exit non-zero.

**Sales transactions are wired but not actually activated:**
- Issue: `internal/sales/service.go` has a transaction path, but `cmd/server/main.go` never calls `(*sales.Service).SetPool`.
- Files: `cmd/server/main.go`, `internal/sales/service.go`
- Impact: order creation falls back to non-transactional writes, so partial order/item/stock writes can leak through on failure.
- Fix approach: wire the pool in `main.go` and add a startup test that proves the transactional path is used.

## Known Bugs

**Offline sync can strand orders in `syncing`:**
- Symptoms: a sync failure marks orders as `syncing`, then the catch path re-reads `pending` orders instead of `syncing` ones.
- Files: `frontend/src/pos/hooks/useSync.ts`, `frontend/src/pos/hooks/useOfflineOrders.ts`
- Trigger: any network/server failure during `/api/orders/sync`.
- Workaround: none in code; the queued orders stay stuck until storage is manually cleared.

**Cashier management endpoints are public or unreachable:**
- Symptoms: `GET /api/auth/cashiers` returns all cashiers without auth, and `POST /api/auth/cashiers` expects `user_id` in context even though the auth router is mounted without middleware.
- Files: `internal/auth/handler.go`, `cmd/server/main.go`, `internal/auth/service.go`
- Trigger: direct request to `/api/auth/cashiers`.
- Workaround: none.

**Inventory and catalog errors are collapsed into the wrong domain errors:**
- Symptoms: several DB failures are returned as `ErrVariantNotFound` or `ErrProductNotFound`.
- Files: `internal/inventory/service.go`, `internal/catalog/service.go`
- Trigger: transient DB errors, permission errors, or other non-404 failures.
- Workaround: none; callers see misleading 404s instead of actionable errors.

## Security Considerations

**JWT and session material are stored in browser storage:**
- Risk: tokens are persisted in `localStorage`/`sessionStorage`, so any XSS or malicious extension can steal them.
- Files: `frontend/src/lib/auth.ts`, `frontend/src/lib/api.ts`, `frontend/src/lib/reporting-api.ts`, `frontend/src/lib/erp-api.ts`
- Current mitigation: token expiry is checked client-side before reuse.
- Recommendations: move auth to HttpOnly cookies or another server-managed session mechanism.

**Production-safe secrets are not enforced:**
- Risk: `cmd/server/main.go` falls back to a hardcoded `JWT_SECRET`, and `internal/database/db.go` falls back to a local PostgreSQL URL with `sslmode=disable`.
- Files: `cmd/server/main.go`, `internal/database/db.go`
- Current mitigation: none beyond environment variables when present.
- Recommendations: require secrets/config at startup and refuse defaults outside local dev.

**Login endpoints have no brute-force protection:**
- Risk: `internal/auth/handler.go` exposes password and PIN login with no throttling, lockout, or audit trail.
- Files: `internal/auth/handler.go`, `internal/auth/service.go`, `cmd/server/main.go`
- Current mitigation: bcrypt hides password/PIN hashes at rest.
- Recommendations: add rate limiting and login attempt telemetry.

## Performance Bottlenecks

**N+1 reads in catalog and receipt loading:**
- Problem: `internal/catalog/service.go` loads variants and category data per product, and `internal/sales/service.go` loads variants per receipt item.
- Files: `internal/catalog/service.go`, `internal/sales/service.go`
- Cause: repeated round-trips instead of batched reads.
- Improvement path: fetch products/variants/categories in bulk and assemble in memory.

**Inventory checks duplicate reads before writes:**
- Problem: `internal/inventory/service.go` checks variant existence, then stock, then writes a ledger entry.
- Files: `internal/inventory/service.go`
- Cause: read-then-write flow without a single atomic statement.
- Improvement path: push stock validation into one transactional write or conditional update.

## Fragile Areas

**Context values use raw string keys:**
- Files: `internal/middleware/auth.go`
- Why fragile: string keys are collision-prone and easy to misuse across packages.
- Safe modification: replace them with unexported typed keys and accessor helpers.
- Test coverage: no tests exercise context-key collisions or middleware composition.

**POS sync state machine is split across hooks and storage:**
- Files: `frontend/src/pos/hooks/useSync.ts`, `frontend/src/pos/hooks/useOfflineOrders.ts`, `frontend/src/lib/db.ts`
- Why fragile: status transitions depend on multiple asynchronous reads/writes and one incorrect query breaks recovery.
- Safe modification: centralize queue transitions in one store/API layer.
- Test coverage: no direct tests for the failure path or retry scheduling.

**Catalog mutation methods swallow DB failures:**
- Files: `internal/catalog/service.go`
- Why fragile: `UpdateProduct`, `CreateVariant`, and related paths map broad errors to not-found/duplicate states.
- Safe modification: distinguish `pgx.ErrNoRows` from transport/database failures.
- Test coverage: service tests cover happy paths only.

## Scaling Limits

**Single-process, synchronous order synchronization:**
- Current capacity: batch sync is processed sequentially in `internal/sales/service.go`.
- Limit: large offline queues will block on one slow or failing item.
- Scaling path: parallelize at the batch boundary after transactional correctness is fixed.

**Browser-held offline cache has no eviction policy:**
- Current capacity: Dexie/localStorage/sessionStorage caches grow until browser storage limits are hit.
- Limit: large catalogs or long-lived sessions can exhaust client storage.
- Scaling path: add pruning, pagination, and explicit cache versioning.

## Test Coverage Gaps

**Auth and startup paths are untested:**
- What's not tested: bootstrap failure handling, role enforcement, login throttling, and cashier endpoints.
- Files: `cmd/server/main.go`, `internal/auth/handler.go`, `internal/auth/service.go`, `internal/middleware/auth.go`
- Risk: security and startup regressions can ship unnoticed.
- Priority: High.

**Inventory concurrency is untested:**
- What's not tested: simultaneous deductions, negative-stock races, and DB error mapping.
- Files: `internal/inventory/service.go`
- Risk: overselling and misleading 404 responses.
- Priority: High.

**POS sync failure recovery is untested:**
- What's not tested: network/server failures, retry backoff, and stuck-sync cleanup.
- Files: `frontend/src/pos/hooks/useSync.ts`, `frontend/src/pos/hooks/useOfflineOrders.ts`
- Risk: offline orders can disappear from the retry queue.
- Priority: High.

**Backend route authorization is under-tested:**
- What's not tested: cashier access to ERP/catalog/reporting routes.
- Files: `cmd/server/main.go`, `internal/middleware/auth.go`, `internal/catalog/handler.go`, `internal/reporting/handler.go`
- Risk: authorization regressions remain invisible because only frontend route guards are exercised.
- Priority: High.

---

*Concerns audit: 2026-05-02*

# Codebase Concerns

**Analysis Date:** 2026-04-25

## Project State Summary

**Status:** Pre-development - no source code exists
**Stack:** Go (chi + sqlc + pgx) + Vite + React
**Phase:** All phases "Not started" - full reset from Encore TypeScript

---

## Critical Concerns

### No Source Code Exists

**Issue:** The entire codebase needs to be created from scratch.
**Impact:** No working system, no tests, no deployment.
**Mitigation:** Follow the roadmap phases sequentially. Start with Phase 1 (Foundation & Backend Core).

---

## Architectural Concerns

### Offline-First Complexity

**Issue:** The core value proposition requires robust offline capability.
**Files to create:** `frontend/src/service-worker.ts`, `frontend/src/lib/offline-sync.ts`, `frontend/src/lib/indexeddb.ts`
**Risk:** Offline sync is notoriously difficult to get right.
**Specific concerns:**
- Race conditions when multiple devices sell the same item offline
- Conflict resolution when server rejects offline operations
- Data loss if local IndexedDB is cleared
**Mitigation path:** Use delta sync (operations, not state), implement queue pattern on server, client-generated UUIDs for offline orders.

### Inventory Ledger Implementation

**Issue:** Must implement inventory as ledger + derived snapshot, not quantity column.
**Files to create:** `db/migrations/`, `internal/inventory/ledger.go`, `internal/inventory/service.go`
**Risk:** Forgetting this leads to race conditions and no audit trail.
**Mitigation path:** Document in ARCHITECTURE.md. Create migration with `inventory_ledger` table first, `product_variant` table with `quantity` as computed/cache column.

### Product → Variant Hierarchy

**Issue:** Must never create flat product schema with size/color columns.
**Files to create:** `db/queries/catalog.sql`, `internal/catalog/product.go`, `internal/catalog/variant.go`
**Risk:** Flat schema causes data duplication and reporting issues.
**Mitigation path:** Always create `products` (parent) and `product_variants` (child) tables. SKU, barcode, price, cost belong to variant.

---

## Domain-Specific Concerns (From Research)

### WebUSB Browser Support

**Issue:** Thermal printer via WebUSB doesn't work on iOS.
**Files to create:** `frontend/src/lib/print.ts`
**Risk:** iPads are common in retail; entire printing flow fails.
**Mitigation path:** Implement hybrid printing - detect OS, fallback to AirPrint on iOS.

### Last Write Wins in Offline Sync

**Issue:** Simple object sync overwrites inventory incorrectly.
**Risk:** Two devices selling same item results in wrong stock count.
**Mitigation path:** Delta sync only - send "decrement 1", not "set to 9". Process sync queue sequentially on server.

### Tax Calculation on Total

**Issue:** Calculating tax on final cart total causes rounding errors.
**Mitigation path:** Calculate tax per line item, round, then sum.

### Hardcoded Currencies

**Issue:** Assuming `$` or `.` for decimals breaks THB display.
**Mitigation path:** Use `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })`. Store amounts as integers (satang).

---

## Infrastructure Concerns

### No Database Schema

**Issue:** No PostgreSQL migrations exist.
**Files to create:** `db/migrations/*.sql`, `db/queries/*.sql`
**Risk:** Cannot test, cannot deploy.
**Mitigation path:** Start with golang-migrate migrations. Create auth, catalog, inventory, sales tables.

### No Docker Setup

**Issue:** No Docker Compose for local development.
**Files to create:** `docker-compose.yml`, `Dockerfile`
**Risk:** Inconsistent development environments.
**Mitigation path:** Create docker-compose.yml with Go app + PostgreSQL services.

### No API Endpoints

**Issue:** No chi router handlers exist.
**Files to create:** `cmd/server/main.go`, `internal/*/handler.go`
**Risk:** No way to test frontend.
**Mitigation path:** Build backend first per Phase 1 success criteria.

### No Frontend Code

**Issue:** No Vite + React application exists.
**Files to create:** `frontend/src/`, `frontend/index.html`, `frontend/vite.config.ts`
**Risk:** Cannot demonstrate POS/ERP interfaces.
**Mitigation path:** Create Vite React app with TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui.

---

## Security Considerations

### Authentication Implementation

**Issue:** JWT-based auth needs careful implementation.
**Files to create:** `internal/auth/handler.go`, `internal/auth/service.go`, `internal/auth/middleware.go`
**Risk:** Token leakage, weak PIN implementation, role-based access bypass.
**Current mitigation:** Plan uses JWT in Authorization header, role-based middleware.
**Recommendations:**
- Use secure random for JWT secrets
- Implement token expiration
- Hash PINs (not store plaintext)
- Enforce role checks on all endpoints

### No HTTPS in Development

**Issue:** Service worker requires secure context.
**Risk:** PWA features won't work on HTTP.
**Mitigation path:** Use localhost (treated as secure) or set up self-signed cert for development.

---

## Performance Bottlenecks

### Inventory Queries at Scale

**Issue:** Aggregating ledger for current stock is slow with high transaction volume.
**Files to create:** `db/queries/inventory.sql`
**Risk:** Slow product loading in ERP.
**Mitigation path:** Consider periodic snapshot table (INV-V2-02 in v2) or materialized views.

### Large Catalog Loading

**Issue:** Loading all products at once in POS is slow.
**Files to create:** `frontend/src/api/catalog.ts`
**Risk:** Slow catalog grid, poor offline cache.
**Mitigation path:** Implement pagination, category-based loading, offline IndexedDB cache.

---

## Dependencies at Risk

### Go Stack Dependencies

**Issue:** New Go stack choices - chi, sqlc, pgx.
**Packages:**
- `github.com/go-chi/chi/v5` - Router
- `github.com/sqlc-dev/sqlc` - Code generation
- `github.com/jackc/pgx/v5` - PostgreSQL driver
- `github.com/golang-migrate/migrate` - Migrations
- `github.com/golang-jwt/jwt/v5` - JWT handling
- `github.com/google/uuid` - UUID generation
**Risk:** Less battle-tested in this specific combination for POS.
**Mitigation path:** Follow AGENTS.md conventions strictly. Use standard library where possible.

### Frontend Dependencies

**Issue:** Multiple frontend libraries need integration.
**Packages:**
- `vite` - Build tool
- `react` + `react-dom` - UI framework
- `@tanstack/react-query` - Server state
- `@tanstack/react-router` - Routing
- `tailwindcss` - Styling
- `dexie` - IndexedDB
- `shadcn/ui` - Components
**Risk:** Version conflicts, complex setup.
**Mitigation path:** Follow AGENTS.md frontend conventions exactly.

---

## Missing Critical Features (v1 Requirements)

All v1 requirements are pending. Key gaps that block core value:

| Requirement | Description | Priority |
|-------------|-------------|----------|
| AUTH-01 | Owner account creation | Critical |
| AUTH-04 | Cashier PIN login | Critical |
| INV-01 | Inventory ledger | Critical |
| INV-02 | Stock auto-deduct on sale | Critical |
| OFF-01 | Offline sales capability | Critical |
| OFF-04 | Delta sync for stock | Critical |
| POS-01 | Barcode scanning | High |
| PAY-01 | Cash payment with change | High |
| REC-01 | Receipt printing | High |

---

## Fragile Areas (Expected)

### Offline Sync Queue

**Files to create:** `frontend/src/lib/sync-queue.ts`
**Why fragile:** Network conditions, conflicts, data integrity.
**Safe modification:** Add thorough logging, implement retry with exponential backoff, test edge cases.

### Inventory Ledger Queries

**Files to create:** `db/queries/inventory.sql`
**Why fragile:** Incorrect calculations break stock accuracy.
**Safe modification:** Test with concurrent transactions, verify derived quantity matches ledger sum.

### JWT Middleware

**Files to create:** `internal/auth/middleware.go`
**Why fragile:** Security bypasses affect entire system.
**Safe modification:** Thorough security review, test role-based access violations.

---

## Test Coverage Gaps

**What's not tested:** Nothing exists yet.
**Risk:** Every new feature starts with zero coverage.
**Priority:** All new code needs tests.

**Recommended test strategy:**
- Go: `go test ./...` with table-driven tests
- Frontend: Vitest for unit tests
- API: `httptest` package for handler tests in Go

---

## Research Flags (From ROADMAP.md)

| Flag | Area | Action |
|------|------|--------|
| sqlc + pgx patterns for POS domain | Phase 1 | Research during planning |
| BarcodeDetector API performance | Phase 2 | Validate scanning speed |
| Thai QR PromptPay gateway API | Phase 3 | Research payment provider |
| Report export formats | Phase 4 | Research PDF/Excel libs |

---

## Summary

This is a greenfield project with significant complexity in the offline-first POS requirements. The main concerns are:

1. **No existing code** - everything needs to be built
2. **Offline sync complexity** - race conditions, conflict resolution
3. **Domain pitfalls** - must avoid quantity column, flat products, WebUSB-only printing
4. **Security** - JWT auth, PIN storage, role enforcement
5. **Performance** - inventory queries at scale, catalog loading

The planning documents are thorough. The key is following the roadmap sequentially and implementing the identified pitfalls correctly from the start.

---

*Concerns audit: 2026-04-25*
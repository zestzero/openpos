---
milestone: M001
slice: S01
version: 1.0
written: 2026-04-03
uat_mode: artifact-driven
---

# S01: Foundation Backend Core — UAT

**Milestone:** M001  
**Slice:** S01  
**Written:** 2026-04-03T18:07:00Z

## UAT Type

- **UAT mode:** Artifact-driven (verify source code, TypeScript compilation, schema correctness, and endpoint existence)
- **Why this mode is sufficient:** This is a backend infrastructure slice with no UI. Verification focuses on correct data models, working endpoints, role enforcement, and database schema. Runtime testing will be integrated in S02 when frontend is available. Code review and compile-time checks are the appropriate gates for this phase.

## Preconditions

1. **Backend directory exists and is clean:** `cd backend && ls -la | grep -E "auth|catalog|inventory"`
2. **Node modules installed:** `npm install` has completed without errors
3. **TypeScript environment ready:** `npx tsc --version` returns a valid version
4. **No breaking TypeORM/Encore version conflicts:** `npm list typeorm encore.dev` shows compatible versions
5. **All migration files present:** 3 services × 1 migration file each = 6 .sql files exist under `*/migrations/`

## Smoke Test

**One quick check that confirms the slice basically works:**

```bash
cd backend && npx tsc --noEmit
# Expected: Exit code 0, no type errors
```

If this passes, all three services compiled successfully with correct TypeORM entities and Encore declarations.

## Test Cases

### 1. Auth Service: Owner Registration (T01)

**Purpose:** Verify that owner registration creates a user with email, password hash, and OWNER role.

1. Open `backend/auth/auth.ts` and locate the `register()` endpoint
2. Verify the endpoint signature: `method: "POST", path: "/auth/register"`
3. Verify parameter parsing: `email` (string) and `password` (string) required
4. Verify password hashing: `bcrypt.hash(req.password, 10)` is called
5. Verify JWT token issuance: Returns object with `token` field containing JWT string
6. Verify token has 24h expiry: Check `expiresIn: "24h"` in `jwt.sign()` call
7. **Expected:** Registration creates user with role='OWNER', hashes password, returns signed JWT token

### 2. Auth Service: User Creation by Owner (T02)

**Purpose:** Verify that owners can create cashier accounts with PIN-based login.

1. Open `backend/auth/auth.ts` and locate `createUser()` endpoint
2. Verify endpoint signature: `POST /auth/users` with `auth: true` (requires JWT)
3. Verify role enforcement: `requireRole("OWNER")` is called before DB operations
4. Verify request structure: Accept `{ email, pin?, role }`
5. Verify PIN validation for Cashiers: 4-6 digit numeric PIN required if role='CASHIER'
6. Verify PIN hashing: PIN is bcrypt-hashed before storage
7. **Expected:** Only owners can create users; Cashiers must have valid 4-6 digit PIN

### 3. Auth Service: Cashier PIN Login (T02)

**Purpose:** Verify that cashiers can log in using numeric PIN.

1. Open `backend/auth/auth.ts` and locate `loginPin()` endpoint
2. Verify endpoint signature: `POST /auth/login-pin` with `method: "POST"` and `path: "/auth/login-pin"`
3. Verify request structure: `{ pin: string }`
4. Verify PIN format validation: Regex enforces 4-6 digits (e.g., `/^\d{4,6}$/`)
5. Verify lookup strategy: Fetches active cashiers (not deleted) and verifies PIN in-memory with bcrypt
6. Verify JWT token issuance: Returns JWT with role='CASHIER'
7. **Expected:** Valid PIN returns JWT; invalid PIN throws 401 Unauthorized

### 4. Middleware: Role Enforcement (T02)

**Purpose:** Verify that role-based access control prevents unauthorized access.

1. Open `backend/auth/middleware.ts` and locate `requireRole()` function
2. Verify it calls `getAuthData()` to extract current user's role from JWT
3. Verify it throws `APIError.unauthenticated()` if no auth context
4. Verify it throws `APIError.permissionDenied()` if role doesn't match required role
5. Verify `getAuthData()` integration: Uses Encore's native auth handler
6. **Expected:** Protected endpoints enforce role matching; unauthorized access returns 401 or 403

### 5. Catalog Service: Product Creation (T03)

**Purpose:** Verify that catalog service creates products with categories and variants.

1. Open `backend/catalog/api.ts` and locate `createProduct()` endpoint
2. Verify endpoint signature: `POST /catalog/products` with `auth: true`
3. Verify role enforcement: `requireRole("OWNER")` required
4. Verify request structure: `{ name, description?, category_id?, image_url? }`
5. Verify entity creation: Calls `repo.create()` and `repo.save()` on TypeORM Product repository
6. Verify response includes: `id, name, description, category_id, image_url`
7. **Expected:** Owners can create products; endpoint returns created product with UUID

### 6. Catalog Service: Variant with SKU and Barcode (T03)

**Purpose:** Verify that variants have SKU, barcode, price, and cost fields.

1. Open `backend/catalog/entities.ts` and locate `Variant` class
2. Verify @Entity decorator: `@Entity("variants")`
3. Verify columns: `@Column() sku: string`, `@Column() barcode?: string`, `@Column("decimal") price: number`, `@Column("decimal") cost?: number`
4. Verify relationship: `@ManyToOne(() => Product, product => product.variants)`
5. Verify uniqueness enforcement: Either schema constraint or application-level check on SKU per product
6. **Expected:** Variant entity maps to variants table with price/cost as decimal types

### 7. Catalog Service: Category Hierarchy (T03)

**Purpose:** Verify that categories support parent-child relationships.

1. Open `backend/catalog/migrations/1_create_catalog.up.sql` and locate CREATE TABLE categories
2. Verify columns: `id (UUID), name (TEXT), parent_id (UUID nullable), sort_order (INT), created_at, updated_at`
3. Verify parent_id is nullable: Root categories have no parent
4. Verify sort_order: Enables reordering categories
5. Verify indexes: `UNIQUE(parent_id, name)` prevents duplicate sibling names (optional but recommended)
6. **Expected:** Categories table supports tree structure with nullable parent_id

### 8. Inventory Service: Ledger Entry Creation (T04)

**Purpose:** Verify that inventory ledger records all stock movements.

1. Open `backend/inventory/api.ts` and locate `createLedgerEntry()` endpoint
2. Verify endpoint signature: `POST /inventory/ledger` with `auth: true`
3. Verify request structure: `{ variant_id, delta (number), type (sale|restock|adjustment|sync), reference_id?, reason?, client_generated_id? }`
4. Verify type enforcement: Type must be one of allowed values
5. Verify idempotency: If `client_generated_id` is provided and exists, return cached entry instead of creating duplicate
6. Verify response includes: `id, variant_id, delta, type, reference_id, reason, client_generated_id, created_at`
7. **Expected:** Ledger entries are idempotent; duplicate sends with same client_generated_id return cached result

### 9. Inventory Service: Stock Level Calculation (T04)

**Purpose:** Verify that stock levels are calculated from snapshot + ledger deltas.

1. Open `backend/inventory/api.ts` and locate `getVariantStock()` endpoint
2. Verify endpoint signature: `GET /inventory/variants/:id/stock`
3. Verify calculation logic: Fetch latest snapshot for variant → if none, use 0 → add all ledger deltas since snapshot → return current level
4. Verify response structure: `{ variant_id, current_stock: number, snapshot_level: number, last_snapshot_at: ISO8601 }`
5. Verify ledger delta ordering: Uses `created_at` to ensure chronological sum
6. **Expected:** Stock level is correctly calculated; repeated calls with same data return same result

### 10. Inventory Service: Snapshot with Idempotency (T04)

**Purpose:** Verify that snapshots cache stock levels and ledger includes idempotency key.

1. Open `backend/inventory/migrations/1_create_inventory.up.sql` and locate inventory_ledger table
2. Verify columns: `id (UUID), variant_id (UUID FK), delta (INT), type (VARCHAR), reference_id (UUID nullable), reason (TEXT nullable), client_generated_id (UUID nullable), created_at (TIMESTAMPTZ)`
3. Verify uniqueness: `UNIQUE(client_generated_id)` on ledger prevents duplicate insertions
4. Open inventory_snapshot table in same migration
5. Verify columns: `id (UUID), variant_id (UUID FK), level (INT), created_at (TIMESTAMPTZ)`
6. **Expected:** Both tables exist with correct schema and constraints

### 11. Database Migrations: Schema Validation (T01, T03, T04)

**Purpose:** Verify that all three migration files create correct table structures.

1. List all migration files: `find backend -name "*.up.sql" | sort`
2. Expected files (exactly 3):
   - `backend/auth/migrations/1_create_users.up.sql`
   - `backend/catalog/migrations/1_create_catalog.up.sql`
   - `backend/inventory/migrations/1_create_inventory.up.sql`
3. Verify each migration has:
   - Appropriate CREATE TABLE statements
   - UUID primary keys with `DEFAULT gen_random_uuid()`
   - Timestamps with `DEFAULT CURRENT_TIMESTAMP`
   - Foreign keys where relationships exist
   - Appropriate data types (DECIMAL for prices, INT for counts, TEXT for strings)
4. **Expected:** All 3 migrations exist and are syntactically valid SQL

### 12. TypeORM DataSource Singleton (T01, T03, T04)

**Purpose:** Verify that each service has a lazy-loaded DataSource singleton.

1. Verify 3 datasource files exist: `backend/auth/datasource.ts`, `backend/catalog/datasource.ts`, `backend/inventory/datasource.ts`
2. Verify each file exports `getDataSource()` function
3. Verify function returns `DataSource` instance
4. Verify lazy-loading pattern: `if (!ds) { ds = new DataSource(...) }`
5. Verify DataSource configuration: Uses Encore's `sql.connectionString` from environment
6. **Expected:** Each service has isolated DataSource; no global connection pool

### 13. TypeScript Compilation (All Tasks)

**Purpose:** Verify that all TypeScript code compiles without errors.

1. From `backend/` directory, run: `npx tsc --noEmit --strict`
2. Expect exit code 0
3. Expect zero error messages
4. **Expected:** All types are correct; no implicit any, unused variables, or type mismatches

### 14. Encore Service Declarations (T01, T03, T04)

**Purpose:** Verify that all three services are correctly declared.

1. Verify 3 files exist: `backend/auth/encore.service.ts`, `backend/catalog/encore.service.ts`, `backend/inventory/encore.service.ts`
2. Verify each contains: `export const db = new sql.Database("...")`
3. Verify service is named appropriately: db.sqlDatabase parameter matches service name
4. **Expected:** Encore can discover and provision all three databases

## Edge Cases

### Case 1: Duplicate Email Registration

1. Call `POST /auth/register` twice with same email
2. **Expected:** Second call throws `APIError.alreadyExists("user already exists")`

### Case 2: Invalid PIN Format for Cashier Creation

1. Call `POST /auth/users` with role='CASHIER' and pin='123' (only 3 digits)
2. **Expected:** Throws `APIError.invalidArgument()` or similar validation error

### Case 3: Accessing Owner-Only Endpoint as Cashier

1. Obtain JWT token with role='CASHIER'
2. Call `POST /auth/users` with that token (Owner-only endpoint)
3. **Expected:** Throws `APIError.permissionDenied()` with 403 status

### Case 4: Stock Level with No Snapshots

1. Create variant
2. Add ledger entries without creating snapshot
3. Call `GET /inventory/variants/:id/stock`
4. **Expected:** Returns calculated level from ledger deltas alone (assumes snapshot=0)

### Case 5: Duplicate Ledger Entry with Same client_generated_id

1. Call `POST /inventory/ledger` with client_generated_id='abc123', delta=10
2. Call same endpoint again with same client_generated_id and delta=10
3. **Expected:** Second call returns cached entry; database has only one ledger entry for 'abc123'

### Case 6: Category with Same Name Under Same Parent

1. Create two categories with name='Clothing' under same parent
2. **Expected:** Either second creation fails (schema constraint) or application rejects with validation error

## Failure Signals

Any of these indicate something is broken:

- TypeScript compilation fails with errors
- Missing files: `auth/auth.ts`, `catalog/api.ts`, `inventory/api.ts`, or any datasource files
- Database migration files malformed or missing
- Endpoint signatures don't match expected paths (`/auth/register`, `/catalog/products`, `/inventory/ledger`)
- Role enforcement missing: `requireRole()` not called in protected endpoints
- Missing TypeORM decorators: Entities don't have `@Entity`, `@Column`, `@PrimaryGeneratedColumn`
- DataSource not lazy-loaded: Singleton pattern not followed
- Idempotency not implemented: `client_generated_id` field missing from InventoryLedger
- Stock calculation doesn't include snapshots or ledger

## Requirements Proved By This UAT

This UAT proves the following REQUIREMENTS.md items:

- **AUTH-01:** Owner can create account with email and password
- **AUTH-02:** Owner can log in and get JWT (session via token)
- **AUTH-03:** Owner can create cashier accounts
- **AUTH-04:** Cashier can log in with numeric PIN
- **AUTH-05:** System enforces role-based access
- **PROD-01:** Owner can create products
- **PROD-02:** Variants have SKU, barcode, price, cost
- **PROD-03:** Products/variants can be edited and archived (PATCH/DELETE endpoints)
- **PROD-04:** Categories organize products
- **PROD-05:** Barcode field exists on variants
- **INV-01:** Stock changes recorded in ledger
- **INV-02:** Stock deduction via ledger entry
- **INV-03:** Manual stock adjustment with reason
- **INV-04:** Current stock levels viewable
- **PLAT-02:** Encore TypeScript backend with service-per-domain
- **PLAT-03:** PostgreSQL auto-provisioned per service

## Not Proved By This UAT

This UAT does NOT prove:

- **Frontend integration:** S01 doesn't include frontend code; S02 will verify POS/ERP UI can call these endpoints
- **Real database persistence:** UAT verifies code structure, not actual PostgreSQL runtime. Integration tests in S02 will verify data survives restart
- **Payment processing:** S03 handles payments; S01 only provides inventory foundation
- **Offline sync:** Idempotency keys exist, but S02 tests actual offline queue and sync retry logic
- **Barcode scanning:** POS barcode detection is frontend concern (S02)
- **Receipt printing:** Receipt generation is frontend/payment concern (S03)
- **Scalability:** This UAT verifies correctness, not performance under load
- **Security audit:** JWT secret handling, CORS, rate limiting, SQL injection prevention not validated here

## Notes for Tester

1. **TypeScript errors are fatal:** If `npx tsc --noEmit` fails, stop and fix before continuing. Type safety is essential for Encore client generation.

2. **Role enforcement is critical:** Verify every protected endpoint actually calls `requireRole()`. Missing middleware means authorization bypass.

3. **Ledger idempotency is for offline sync:** The `client_generated_id` field seems optional, but it's essential for S02 offline queue. Don't skip or relax this validation.

4. **Snapshot logic is subtle:** Stock = (latest snapshot) + SUM(ledger deltas after snapshot). Verify both parts are included. Missing ledger deltas would undercount stock.

5. **DataSource is a singleton:** If you see `new DataSource()` being called multiple times, that's wrong. Each service should call `getDataSource()` once, which returns cached instance.

6. **Encore Cloud integration untested here:** This UAT verifies local code structure. Deploying to Encore Cloud (in S02) will verify migrations actually run and databases provision. Expect that test too.

7. **Database constraints are expected:** The migration files define UNIQUE constraints and FKs. These prevent bad data at the DB level, which is good. Don't bypass them in tests.

8. **Error handling is consistent:** All endpoints use `APIError` with standard status codes (400, 401, 404, 409). Client code should handle these uniformly.

### Known rough edges

- **JWT_SECRET fallback:** Uses hardcoded string in dev. Document that prod must set env var.
- **PIN hash lookup:** Inefficient for large Cashier populations (>100). Not a problem for MVP but document as technical debt.
- **No audit logging:** User creation doesn't record who created the user (created_by). Defer to later phase if required.


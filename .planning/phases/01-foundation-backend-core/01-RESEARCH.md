# Phase 01 — Foundation & Backend Core: Research & Plan

## Summary
This document describes what we need to know and decide to plan Phase 01 effectively. It translates the MUST-address requirement IDs (AUTH-01..AUTH-05, INV-01..INV-04, PLAT-02, PLAT-03) into architecture choices, concrete data models, API contracts, migration & infra tasks, testing/acceptance criteria and a prioritized task list with estimates.

## Context (from .planning)
- Primary goals: deliver operational backend services for Auth, Catalog, Inventory (Encore + TypeORM per CLAUDE.md and planning files).
- Decided data model shape: Product → Variant hierarchy; Categories assigned at Product level. Inventory is ledger-based with snapshots + deltas.
- Service-per-domain architecture: auth, catalog, inventory services; each service has its own PostgreSQL DB provisioned by Encore.

## High-level approach and constraints
- Backend framework: Encore TypeScript services.
- ORM: TypeORM using a "hybrid" pattern: Entities for app-level models, SQL migrations for schema changes (synchronize: false).
- Auth & session: follow secure best practices (recommendation below).
- Offline: Client-produced ledger delta operations (not absolute) with order_id references and idempotency keys.

## Requirements mapping (Phase 01 MUSTs)
- AUTH-01 Owner account creation (email/password)
- AUTH-02 Owner login, persistent sessions across sessions
- AUTH-03 Owner creates cashier accounts and assigns roles
- AUTH-04 Cashier PIN login at register
- AUTH-05 Role-based access enforcement
- INV-01 Inventory ledger with type, quantity delta, reference
- INV-02 Stock deducts when sale completes (ledger entry)
- INV-03 Manual adjustments with reason code
- INV-04 Current stock per variant (derived from ledger)
- PLAT-02 Encore TypeScript backend with service-per-domain architecture
- PLAT-03 PostgreSQL DB auto-provisioned per service by Encore

## Decisions to confirm
- **Token vs server-side session:** Recommended httpOnly refresh cookie + short JWT access token.
- **PIN storage:** Hashed numeric PINs (not plaintext) with rate-limiting.
- **Ledger snapshot cadence:** Start with scheduled nightly snapshot + on-demand snapshot endpoint.

## Concrete data models (TypeORM entity sketches)

### Service: auth
- **User**
  - id: uuid (PK)
  - email: string, unique, indexed
  - password_hash: string
  - role: enum('OWNER','CASHIER')
  - pin_hash: string | null
  - is_active: boolean
  - last_login_at: timestamp
  - created_by: uuid (refers to owner user)

### Service: catalog
- **Category**
  - id: uuid
  - name: string
  - order: integer
- **Product**
  - id: uuid
  - name: string
  - description: text
  - category_id: uuid (FK)
  - archived: boolean
- **Variant**
  - id: uuid
  - product_id: uuid (FK)
  - sku: string, unique
  - barcode: string | null, indexed
  - price_cents: integer
  - cost_cents: integer
  - active: boolean

### Service: inventory
- **InventoryLedger**
  - id: uuid
  - variant_id: uuid (FK)
  - delta: integer
  - type: enum('sale','restock','adjustment','sync')
  - reference_id: uuid | null (e.g., order_id)
  - reason: string | null
  - client_generated_id: uuid | null (idempotency)
  - created_at: timestamp
- **InventorySnapshot**
  - id: uuid
  - variant_id: uuid
  - snapshot_at: timestamp
  - balance: integer

## API contract recommendations

### Auth service endpoints
- `POST /auth/register` (AUTH-01)
- `POST /auth/login` (AUTH-02)
- `POST /auth/users` (AUTH-03) - owner creates cashier accounts
- `POST /auth/pin-login` (AUTH-04)
- `GET /auth/me` (AUTH-05)

### Catalog service endpoints
- `GET /catalog/categories`
- `POST /catalog/categories`
- `GET /catalog/products`
- `POST /catalog/products`
- `GET /catalog/products/:id/variants`
- `PATCH /catalog/variants/:id`

### Inventory service endpoints
- `POST /inventory/ledger` (INV-01, INV-02)
- `POST /inventory/adjustment` (INV-03)
- `GET /inventory/variants/:id/stock` (INV-04)

## Validation Architecture

### 1. Verification Strategy
- **Unit Tests:** Business logic in services (password hashing, PIN validation, stock balance calculation).
- **Integration Tests:** Encore service-to-service communication, TypeORM entity persistence, and Encore-managed migrations.
- **API Tests:** Verify RBAC (Role-Based Access Control) across all endpoints.

### 2. Observable Truths
- Owner can register and login; gets a persistent session.
- Owner can create a cashier; cashier can login via PIN.
- Cashier cannot access owner-only endpoints (e.g., create users).
- Every stock movement (sale, adjustment) creates a ledger entry.
- Current stock is correctly calculated as Snapshot + Sum(Deltas).
- Duplicate offline sync requests (same client_generated_id) do not double-count.

## Task breakdown (recommended epic -> stories)

### Epic A — Auth core (AUTH-01..AUTH-05)
- A1: Create Encore auth service scaffolding, DB provisioning, TypeORM config
- A2: Implement User entity + migrations
- A3: Implement register/login endpoints + password hashing + token logic
- A4: Implement owner-only user creation endpoint + role assignment
- A5: PIN support + PIN login endpoint + rate-limiting
- A6: Role enforcement middleware and tests

### Epic B — Catalog core (Product/Variant/Category)
- B1: Catalog service scaffold + TypeORM + migrations
- B2: Entities: Category, Product, Variant + migrations
- B3: CRUD endpoints for categories/products/variants
- B4: SKU/barcode uniqueness constraints, search endpoints
- B5: Catalog tests + seed data script

### Epic C — Inventory ledger & stock (INV-01..INV-04)
- C1: Inventory service scaffold + TypeORM + migrations
- C2: Implement InventoryLedger and InventorySnapshot entities
- C3: Ledger create endpoint with idempotency handling
- C4: Stock compute endpoint and snapshot aggregation logic
- C5: Adjustment endpoint + reason codes
- C6: Nightly snapshot job + manual snapshot endpoint

## Risk register + mitigations
- **Risk:** Offline client duplicates cause incorrect stock.
  - **Mitigation:** Enforce `client_generated_id` uniqueness at the ledger level.
- **Risk:** Brute-force PIN attacks.
  - **Mitigation:** Implement strict rate-limiting and account lockout for PIN login.
- **Risk:** Stock calculation performance.
  - **Mitigation:** Implement snapshots early; index `variant_id` and `created_at`.

# S01: Foundation Backend Core

**Goal:** Setup the core Authentication service using Encore and TypeORM.
**Demo:** Setup the core Authentication service using Encore and TypeORM.

## Must-Haves


## Tasks

- [x] **T01: 01-foundation-backend-core 01**
  - Setup the core Authentication service using Encore and TypeORM.
Purpose: Establish the identity and access control foundation for the entire POS/ERP system.
Output: Operational Auth service with Owner registration and login capabilities.
- [x] **T02: 01-foundation-backend-core 02**
  - Implement RBAC, PIN-based login for Cashiers, and Role Enforcement Middleware.
Purpose: Secure the system and provide restricted access based on user roles (Owner vs Cashier).
Output: Cashier creation by Owners, PIN-based login for Cashiers, and middleware to enforce roles.
- [x] **T03: 01-foundation-backend-core 03**
  - Setup the core Catalog service for products, variants, and categories.
Purpose: Create the central inventory catalog system for the POS and ERP.
Output: Operational Catalog service with Product, Variant, and Category data models and CRUD endpoints.
- [x] **T04: 01-foundation-backend-core 04**
  - Setup the core Inventory service for ledger-based stock management.
Purpose: Create the central inventory system for the POS and ERP.
Output: Operational Inventory service with Ledger, Snapshot, and Stock management endpoints.

## Files Likely Touched

- `auth/encore.service.ts`
- `auth/migrations/1_create_users.up.sql`
- `auth/user.entity.ts`
- `auth/auth.ts`
- `auth/auth.ts`
- `auth/middleware.ts`
- `catalog/encore.service.ts`
- `catalog/migrations/1_create_catalog.up.sql`
- `catalog/entities.ts`
- `catalog/api.ts`
- `inventory/encore.service.ts`
- `inventory/migrations/1_create_inventory.up.sql`
- `inventory/entities.ts`
- `inventory/api.ts`

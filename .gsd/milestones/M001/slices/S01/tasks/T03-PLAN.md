# T03: 01-foundation-backend-core 03

**Slice:** S01 — **Milestone:** M001

## Description

Setup the core Catalog service for products, variants, and categories.
Purpose: Create the central inventory catalog system for the POS and ERP.
Output: Operational Catalog service with Product, Variant, and Category data models and CRUD endpoints.

## Must-Haves

- [ ] "Owner can create products with variants and categories"
- [ ] "System enforces unique SKUs and barcodes"
- [ ] "Products can be assigned to categories"

## Files

- `catalog/encore.service.ts`
- `catalog/migrations/1_create_catalog.up.sql`
- `catalog/entities.ts`
- `catalog/api.ts`

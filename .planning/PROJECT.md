# OpenPOS

## What This Is

A POS + ERP system for retail stores. Two distinct interfaces: a **mobile-first POS** for salespersons to ring up orders cashier-style, and a **desktop ERP backoffice** for shop owners to manage products, inventory, and sales reports. Built to run your own shop first, then offer to others.

## Core Value

**A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.**

## Requirements

### Validated

*None yet — full reset for Go stack migration.*

### Active

**POS (Mobile-First Cashier Interface)**
- [ ] Add items to cart via barcode scan, touch catalog grid, or name/SKU search
- [ ] Work offline — cache catalog, queue orders, sync when reconnected
- [ ] Auto-deduct stock on completed sale
- [ ] Apply simple discounts (manual % or fixed amount per item or per order)
- [ ] Accept all payment types: cash, card, QR/mobile pay (PromptPay, LINE Pay)
- [ ] Print receipt to thermal printer after completing sale

**ERP (Desktop Backoffice)**
- [ ] Full product management: name, price, barcode, image, category, variants (size/color), cost tracking, supplier info
- [ ] Basic inventory: track current quantity per item, low-stock alerts
- [ ] Daily and monthly sales summary reports (totals, top items)
- [ ] Create, edit, and archive products

**Platform**
- [ ] Single Vite + React SPA with route-based separation (POS routes mobile-optimized, ERP routes desktop-optimized)
- [ ] PWA with service workers for offline capability
- [ ] Email/password authentication with role-based access (cashier vs owner)

### Out of Scope

- Multi-location / multi-warehouse stock — premature complexity for v1
- Promo engine (buy-X-get-Y, time-based deals) — start with simple discounts, extend later
- Financial analytics / profit margins / P&L — sales summaries first
- Batch tracking / expiry / serial numbers — basic inventory is sufficient for v1
- Customer loyalty / membership — not needed for core sale loop
- Multi-currency — THB only for v1

## Context

- **Business type**: Retail store (clothing, electronics, general merchandise)
- **Scale**: Single shop first, architecture supports multi-location later
- **Currency**: Thai Baht (THB) — default and only for v1
- **Users**: Dogfood with own shop, then productize for other retailers
- **Offline requirement**: POS must function without internet — this is the hardest technical constraint and drives architecture decisions around local storage, sync protocol, and conflict resolution

## Constraints

- **Tech stack (backend)**: Go with chi router + sqlc + pgx + PostgreSQL — standard library idioms, SQL-first data access, type-safe generated Go code from SQL queries
- **Tech stack (frontend)**: Vite + React SPA — single app with route-based POS/ERP separation, PWA with service workers for offline capability
- **Database migrations**: Managed via golang-migrate or similar; sqlc generates Go code from SQL queries against the migrated schema
- **Service architecture**: Monolithic Go binary with clean package boundaries per domain (auth, catalog, inventory, sales, reporting) — services communicate in-process via function calls
- **Deployment**: Docker container with self-hosted deployment (VPS, cloud VM, or k8s)
- **Offline sync**: Client-side responsibility — IndexedDB/service worker queue on frontend, REST sync endpoints on backend

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Go backend (chi + sqlc + pgx) | Simple, fast, single binary deployment, SQL-first data access with type safety | Pending |
| sqlc over GORM | SQL-first approach — write queries in SQL, get type-safe Go code; more idiomatic Go than ORM | Pending |
| Monolithic Go binary | Clean package boundaries per domain, in-process communication, simpler deployment than microservices | Pending |
| Docker self-host | Single container deployment, no vendor lock-in, runs anywhere | Pending |
| Single SPA over separate apps | Shared auth, shared components, simpler deployment; route-based separation keeps concerns clear | Pending |
| Vite + React over Next.js | No SSR needed for POS/ERP; Vite is lighter, faster builds, better PWA support | Pending |
| Offline-first POS via PWA | Service workers + IndexedDB for offline queue; avoids React Native complexity while still mobile-capable | Pending |
| Product → Variant hierarchy | Never flat products; variants have own SKU/barcode/price/cost | Pending |
| Inventory ledger + snapshot | Ledger is truth, snapshot is derived cache | Pending |
| Delta sync for offline | Sync operations (decrement 1), not state (set to 9) | Pending |

---
*Last updated: 2026-04-18 — full reset for Go stack migration (was Encore TypeScript)*

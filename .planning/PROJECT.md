# OpenPOS

## What This Is

A POS + ERP system for retail stores. Two distinct interfaces: a **mobile-first POS** for salespersons to ring up orders cashier-style, and a **desktop ERP backoffice** for shop owners to manage products, inventory, and sales reports. Built to run your own shop first, then offer to others.

## Core Value

**A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.**

## Requirements

### Validated

(None yet — ship to validate)

### Active

**POS (Mobile-First Cashier Interface)**
- [ ] Add items to cart via barcode scan, touch catalog grid, or name/SKU search
- [ ] Apply simple discounts (manual % or fixed amount per item or per order)
- [ ] Accept all payment types: cash, card, QR/mobile pay (PromptPay, LINE Pay)
- [ ] Print receipt to thermal printer after completing sale
- [ ] Work offline — cache catalog, queue orders, sync when reconnected
- [ ] Auto-deduct stock on completed sale

**ERP (Desktop Backoffice)**
- [ ] Full product management: name, price, barcode, image, category, variants (size/color), cost tracking, supplier info
- [ ] Basic inventory: track current quantity per item, low-stock alerts
- [ ] Daily and monthly sales summary reports (totals, top items)
- [ ] Create, edit, and archive products

**Platform**
- [ ] Email/password authentication with role-based access (cashier vs owner)
- [ ] Single Vite + React SPA with route-based separation (POS routes mobile-optimized, ERP routes desktop-optimized)
- [ ] Encore TypeScript backend with service-based architecture
- [ ] PostgreSQL database (auto-provisioned per service via Encore)

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

- **Tech stack (backend)**: Encore TypeScript + TypeORM + PostgreSQL — Encore enforces monorepo with flat service directories, single `package.json`, HTTP-based service communication (no gRPC), and auto-provisioned infrastructure
- **Tech stack (frontend)**: Vite + React SPA — single app with route-based POS/ERP separation, PWA with service workers for offline capability
- **Database migrations**: Encore manages schema via SQL migration files (`migrations/*.up.sql`); TypeORM maps entities to existing schema (`synchronize: false`)
- **Service architecture**: Each backend domain (POS, inventory, auth, etc.) is a separate Encore service with its own database — services communicate via typed API calls (`~encore/clients`) or PubSub topics
- **Deployment**: Cloud SaaS via Encore Cloud (deploys to your AWS/GCP account) with Docker self-host option
- **Offline sync**: Client-side responsibility — IndexedDB/service worker queue on frontend, REST sync endpoints + PubSub processing on backend

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Encore TypeScript backend | Infrastructure-as-code, type-safe services, auto-provisioned DB/PubSub, minimal DevOps | — Pending |
| TypeORM over Encore raw SQL | Entity-based modeling for complex product variants; Encore SQL migrations for schema | — Pending |
| Single SPA over separate apps | Shared auth, shared components, simpler deployment; route-based separation keeps concerns clear | — Pending |
| Vite + React over Next.js | No SSR needed for POS/ERP; Vite is lighter, faster builds, better PWA support | — Pending |
| Offline-first POS via PWA | Service workers + IndexedDB for offline queue; avoids React Native complexity while still mobile-capable | — Pending |
| Service-per-domain backend | POS, inventory, ERP/reports, auth as separate Encore services — clean boundaries, independent databases, async communication via PubSub | — Pending |

---
*Last updated: 2026-03-22 after initial project setup*

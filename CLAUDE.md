<!-- GSD:project-start source:PROJECT.md -->
## Project

**OpenPOS**

A POS + ERP system for retail stores. Two distinct interfaces: a **mobile-first POS** for salespersons to ring up orders cashier-style, and a **desktop ERP backoffice** for shop owners to manage products, inventory, and sales reports. Built to run your own shop first, then offer to others.

**Core Value:** **A salesperson can complete a sale end-to-end — scan items, take payment, print receipt — even without internet.**

### Constraints

- **Tech stack (backend)**: Encore TypeScript + TypeORM + PostgreSQL — Encore enforces monorepo with flat service directories, single `package.json`, HTTP-based service communication (no gRPC), and auto-provisioned infrastructure
- **Tech stack (frontend)**: Vite + React SPA — single app with route-based POS/ERP separation, PWA with service workers for offline capability
- **Database migrations**: Encore manages schema via SQL migration files (`migrations/*.up.sql`); TypeORM maps entities to existing schema (`synchronize: false`)
- **Service architecture**: Each backend domain (POS, inventory, auth, etc.) is a separate Encore service with its own database — services communicate via typed API calls (`~encore/clients`) or PubSub topics
- **Deployment**: Cloud SaaS via Encore Cloud (deploys to your AWS/GCP account) with Docker self-host option
- **Offline sync**: Client-side responsibility — IndexedDB/service worker queue on frontend, REST sync endpoints + PubSub processing on backend
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Backend & Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Encore.ts** | Latest | Backend Framework & Cloud Infra | Automates infrastructure (PostgreSQL, Pub/Sub, API Gateway) via TypeScript code. Provides type-safe API clients. |
| **PostgreSQL** | 15+ | Primary Database | Auto-provisioned by Encore. Reliable, relational data model required for ERP/POS. |
| **TypeORM** | 0.3.x | Data Access & ORM | Requested by stack constraints. Powerful entity mapping, but requires specific integration with Encore's migration system. |
### Frontend (SPA & PWA)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vite** | Latest | Build Tool | Fast HMR, optimized production builds for React. |
| **React** | 18/19 | UI Library | Component-based UI for complex POS/ERP interfaces. |
| **TanStack Query** | Latest | Data Fetching & Caching | Manages server state, handles loading/error states, and integrates well with generated Encore clients. |
| **Dexie.js** | Latest | Offline Database (IndexedDB) | Simple wrapper for IndexedDB to store products/orders offline in the POS. |
| **Workbox** | Latest | PWA / Service Worker | Handles asset caching and offline routing for the POS. |
## Architecture & Integration Strategy
### 1. Encore Service Architecture (Modular Monolith)
-   `pos/`: High-availability endpoints for the cashier. Optimized for speed and offline sync.
-   `erp/`: Complex business logic for inventory, reporting, and backoffice management.
-   `auth/`: Centralized authentication (JWT/Session) shared by both.
-   `inventory/`: Source of truth for stock levels, updated by POS and ERP.
### 2. TypeORM Integration Pattern (The "Hybrid" Approach)
### 3. Frontend & Monorepo Structure
-   The frontend imports this client to call backend APIs.
-   **Benefit:** No manual API types or Swagger files needed. End-to-end type safety from DB (TypeORM) -> API (Encore) -> Frontend (React).
### 4. PWA & Offline Architecture
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **ORM** | TypeORM | **Prisma / Drizzle** | TypeORM was requested. However, **Drizzle** has better native integration with Encore's serverless/infrastructure model if requirements were flexible. |
| **Frontend Hosting** | Encore `api.static` | **Vercel / Netlify** | Keep it simple (one deployment pipeline). Move to Vercel only if global edge CDN performance becomes a bottleneck for the static assets. |
| **Architecture** | Monolith | **Microservices** | Encore allows splitting later. Starting distributed adds unnecessary complexity for a POS/ERP MVP. |
## Installation & Setup
# 1. Create Encore App
# 2. Add React Client
# 3. Add Dependencies
## Sources
-   **Encore Docs:** `encore.dev/docs/ts/develop/orms` (ORM Integration)
-   **Encore Docs:** `encore.dev/docs/ts/primitives/static-assets` (Static Serving)
-   **Encore Blog:** "Building a File Sharing Service" (Frontend integration patterns)
-   **TypeORM Docs:** Migration generation and DataSource configuration.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

# Phase 01: Foundation & Backend Core - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the fundamental backend services (Auth, Catalog, Inventory) and their data models. It establishes the "Single Source of Truth" for products and stock, and the authentication layer required for role-based access control.

</domain>

<decisions>
## Implementation Decisions

### Catalog Data Model
- **Full Hierarchy (Product → Variant):** Product entities hold shared metadata (Name, Description, Category). Variant entities hold SKU-specific data (SKU, Barcode, Price, Cost). (Decision: Full Hierarchy)
- **Product-level Category:** Categories are assigned at the Product level. All variants of a product share the same category (e.g., "T-Shirt" is in "Clothing").

### Inventory Ledger
- **Order Reference:** Ledger entries (INV-01) MUST store the `order_id` as a reference for any stock deduction triggered by a sale. This ensures a clean audit trail between sales and inventory.
- **Efficient Aggregation (Snapshot + Delta):** Current stock (INV-04) will be derived using periodic "Snapshot" entries (storing a point-in-time balance) plus the sum of ledger deltas since the last snapshot.

### the agent's Discretion
- **Auth Strategy:** Role-based access (Owner vs Cashier), PIN login flow, and token strategy (JWT/Session) are deferred to standard Encore/TypeORM patterns unless research identifies specific constraints.
- **Service Communication:** Choice between async PubSub or sync API calls for internal service coordination is at the agent's discretion, following Encore best practices.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Core
- `.planning/ROADMAP.md` — Phase 1 goals and success criteria
- `.planning/REQUIREMENTS.md` — AUTH-*, INV-*, and PLAT-* requirements
- `CLAUDE.md` — Project constraints and tech stack (Encore + TypeORM)

### Research Flags (Phase 1)
- *None identified for Phase 1* — Follow standard Encore + TypeORM patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Patterns to Establish
- **Encore Service Structure:** Define `auth`, `catalog`, and `inventory` services.
- **TypeORM Integration:** Follow the Encore + TypeORM "Hybrid" approach where Entities define the schema but Encore handles SQL migrations.

</code_context>

<deferred>
## Deferred Ideas

- **Inventory Snapshots Optimization:** While "Snapshot Support" is decided, the specific trigger (e.g., every 100 entries vs nightly) is deferred to implementation.
- **V2 Features:** Multi-location stock, low-stock alerts, and advanced reporting are explicitly out of scope for v1.

</deferred>

---

*Phase: 01-foundation-backend-core*
*Context gathered: 2026-03-23*

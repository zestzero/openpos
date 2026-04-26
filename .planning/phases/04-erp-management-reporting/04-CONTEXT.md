# Phase 4: ERP Management & Reporting - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the owner-facing ERP surface for managing products, variants, categories, and imports, plus reporting screens for monthly sales and gross profit. This phase consumes the backend and sales data delivered by earlier phases.

</domain>

<decisions>
## Implementation Decisions

### ERP layout
- **D-01:** Desktop-first layout with persistent left navigation and a top utility bar.
- **D-02:** Table-first content area centered on the product/variant grid.
- **D-03:** Use right-side drawers for create/edit flows and dialogs for destructive actions.
- **D-04:** Use tabs to separate operational management from reporting.

### Inventory management surface
- **D-05:** Product management is focused on parent products with nested variants, not flat items.
- **D-06:** Category management is part of the ERP surface.
- **D-07:** CSV import is in scope for bulk product and variant creation.

### Reporting surface
- **D-08:** Reporting must cover monthly sales summary and gross profit metrics.
- **D-09:** Monetary values are displayed in THB only.

### the agent's Discretion
- Exact table columns, filter controls, chart selection, empty states, and import wizard steps.
- Whether reports render as cards, charts, or both.

</decisions>

<specifics>
## Specific Ideas

- Owner needs to create, edit, archive, and bulk import products and variants.
- Owner needs to view monthly sales totals, order count, average order value, and gross profit.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and requirements
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, and requirement IDs.
- `.planning/research/SUMMARY.md` — Domain research, ERP responsibilities, and pitfalls.

### UI contract
- `.planning/phases/04-erp-management-reporting/04-UI-SPEC.md` — Locked layout, spacing, color, and component system decisions.

</canonical_refs>

<deferred>
## Deferred Ideas

- Multi-warehouse support belongs to a future phase.
- Loyalty and supplier management are out of scope for v1.

</deferred>

---

*Phase: 04-erp-management-reporting*
*Context gathered: 2026-04-25*

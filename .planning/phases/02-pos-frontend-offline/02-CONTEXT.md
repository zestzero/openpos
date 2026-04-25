# Phase 2: POS Frontend & Offline - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the mobile-first POS interface for cashiers, including the main POS shell and product browsing/quick-add flows. The POS remains route-separated from the ERP, and the shell must stay usable on small screens while supporting fast selling.

</domain>

<decisions>
## Implementation Decisions

### POS shell layout and navigation
- **D-01:** Use a single POS workspace with shallow navigation, not a deep in-app hierarchy.
- **D-02:** Keep the main working surface focused on the current selling task, with cart and primary actions always easy to reach.
- **D-03:** Preserve route-level separation between POS and ERP; do not mix owner-only navigation into the cashier shell.
- **D-04:** Favor a mobile-first layout that works one-handed and keeps primary actions in thumb reach.

### Product browsing and quick add behavior
- **D-05:** Present products in a touch-friendly category grid with large, scannable cards.
- **D-06:** Provide search by name or SKU alongside browsing, not as a separate hidden mode.
- **D-07:** Surface a favorites / quick-keys bar for one-tap adds of frequent items.
- **D-08:** Product cards should prioritize name, price, and quick-add affordance over dense detail.

### the agent's Discretion
- Exact shell chrome, spacing, and responsive breakpoints.
- Whether the default landing state is catalog-first, search-first, or last-used state if not already established by implementation.
- Variant selection behavior when a product cannot be added directly.
- Loading, empty, and error state presentation inside the POS shell.

</decisions>

<specifics>
## Specific Ideas

- The POS shell should feel fast and uncluttered, not like a desktop admin panel.
- Quick access matters more than deep navigation.
- The browsing experience should support cashier speed under pressure.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope
- `.planning/ROADMAP.md` §Phase 2: POS Frontend & Offline — goal, wave structure, and success criteria.
- `.planning/REQUIREMENTS.md` §§POS — Sale Flow, Platform, POS — Offline — functional requirements for the phase.
- `.planning/PROJECT.md` §§2-3 — product vision, POS interface direction, and technical constraints.

### Frontend conventions
- `AGENTS.md` — frontend stack, route separation, TanStack Query/Router, Tailwind v4, and mobile-first conventions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/package.json` — Vite + React 19 + TanStack Router/Query + Tailwind v4 + Dexie already installed.
- `frontend/src/main.tsx` — current React entry point ready to switch to router/provider composition.
- `frontend/src/App.tsx` — minimal scaffold that can be replaced by POS route structure.
- `frontend/src/app.css` — existing Tailwind v4 theme foundation and base styles.

### Established Patterns
- Single SPA shell already exists in the frontend workspace.
- Tailwind v4 is configured via CSS `@theme`, not a JS config file.
- The repo favors route-separated POS and ERP surfaces.

### Integration Points
- `frontend/src/routes/` for POS shell, catalog, and future route definitions.
- `frontend/src/lib/` for shared API/auth helpers that the POS shell will consume.
- `frontend/src/components/` for reusable UI used across POS screens.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within the POS shell and product browsing scope.

</deferred>

---

*Phase: 02-pos-frontend-offline*
*Context gathered: 2026-04-25*

# Phase 2: POS Frontend & Offline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 02-pos-frontend-offline
**Areas discussed:** POS Screen Layout, Barcode Scanning UX, Frontend Project Setup

---

## POS Screen Layout

### Q1: Cart placement

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom-sheet cart | Full-screen catalog; cart slides up as bottom sheet/drawer | ✓ |
| Side panel cart | Catalog on left, persistent cart panel on right | |
| Separate cart page | Navigate away to a dedicated cart screen | |

**User's choice:** Bottom-sheet cart
**Notes:** None — straightforward selection.

### Q2: Responsive strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Phone-first, tablet bonus | Phone portrait primary; tablet landscape gets split-panel | ✓ |
| Phone-only | Design exclusively for phone, tablet uses same layout | |
| Responsive fluid | Single fluid layout that adapts across all sizes | |

**User's choice:** Phone-first, tablet bonus
**Notes:** None.

### Q3: Top bar design

| Option | Description | Selected |
|--------|-------------|----------|
| Search bar + scan button | Always-visible search with camera icon for scanning | ✓ |
| Category tabs + search toggle | Category tabs primary, search expands on tap | |
| Scan-first header | Large scan button primary, search secondary | |

**User's choice:** Search bar + scan button
**Notes:** None.

### Q4: Cart summary behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Collapsed summary, expand to edit | Bottom bar with count + total; swipe/tap to expand full cart | ✓ |
| Always-visible mini cart | Floating badge showing count, tap opens full cart | |
| Inline cart below catalog | Cart items visible below product grid | |

**User's choice:** Collapsed summary, expand to edit
**Notes:** None.

---

## Barcode Scanning UX

### Q1: Camera scanning trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Tap-to-scan modal | Button opens camera viewfinder overlay; auto-closes on success | ✓ |
| Always-on camera | Persistent camera viewfinder on screen | |
| Long-press to scan | Long-press scan button activates camera | |

**User's choice:** Tap-to-scan modal
**Notes:** None.

### Q2: USB wedge scanner handling

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-detect rapid input | Detect keystroke bursts < 50ms between chars + Enter | ✓ |
| Dedicated input field | Visible input field that captures scanner output | |
| Toggle scanner mode | Manual toggle between keyboard and scanner mode | |

**User's choice:** Auto-detect rapid input
**Notes:** No dedicated field needed; works globally on the POS screen.

### Q3: Barcode not found behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Toast notification | Non-blocking "Barcode not found" toast for ~3 seconds | ✓ |
| Modal alert | Blocking dialog requiring dismiss | |
| Inline error | Error message in the search/scan area | |

**User's choice:** Toast notification
**Notes:** Should not interrupt scanning flow.

---

## Frontend Project Setup

### Q1: UI component library

| Option | Description | Selected |
|--------|-------------|----------|
| shadcn/ui + Tailwind CSS | Accessible composable primitives, copy-paste ownership | ✓ |
| Material UI | Full component library, opinionated design system | |
| Headless UI + custom styles | Unstyled primitives, full design freedom | |

**User's choice:** shadcn/ui + Tailwind CSS
**Notes:** None.

### Q2: State management

| Option | Description | Selected |
|--------|-------------|----------|
| TanStack Query + Zustand | TQ for server state, Zustand for client state (cart/UI) | ✓ |
| TanStack Query + React Context | TQ for server, Context for simple client state | |
| TanStack Query + Jotai | TQ for server, Jotai atomic state for client | |

**User's choice:** TanStack Query + Zustand
**Notes:** None.

### Q3: Routing

| Option | Description | Selected |
|--------|-------------|----------|
| TanStack Router | Type-safe file-based routing, built-in data loading | ✓ |
| React Router v7 | Established standard, large ecosystem | |

**User's choice:** TanStack Router
**Notes:** Route groups: /pos/* and /erp/*.

### Q4: API integration

| Option | Description | Selected |
|--------|-------------|----------|
| Encore generated client + TanStack Query wrappers | Auto-generated TS client with TQ hooks | ✓ |
| Manual fetch + TanStack Query | Hand-written fetch functions with TQ | |

**User's choice:** Encore generated client + TanStack Query wrappers
**Notes:** None.

---

## Agent's Discretion

- Catalog & Favorites: category grid design, favorites bar behavior, variant selection UX
- Offline Strategy & Sync: pre-caching, offline order storage, sync queue UI, delta sync conflict handling

## Deferred Ideas

None — discussion stayed within phase scope.

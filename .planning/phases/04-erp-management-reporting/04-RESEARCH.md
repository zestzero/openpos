# Phase 4: ERP Management & Reporting - Research

**Researched:** 2026-04-25  
**Domain:** Desktop ERP UI, catalog management, reporting, exports  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Desktop-first layout with persistent left navigation and a top utility bar.
- **D-02:** Table-first content area centered on the product/variant grid.
- **D-03:** Use right-side drawers for create/edit flows and dialogs for destructive actions.
- **D-04:** Use tabs to separate operational management from reporting.
- **D-05:** Product management is focused on parent products with nested variants, not flat items.
- **D-06:** Category management is part of the ERP surface.
- **D-07:** CSV import is in scope for bulk product and variant creation.
- **D-08:** Reporting must cover monthly sales summary and gross profit metrics.
- **D-09:** Monetary values are displayed in THB only.

### the agent's Discretion
- Exact table columns, filter controls, chart selection, empty states, and import wizard steps.
- Whether reports render as cards, charts, or both.

### Deferred Ideas (OUT OF SCOPE)
- Multi-warehouse support belongs to a future phase.
- Loyalty and supplier management are out of scope for v1.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROD-01 | Owner can create products with name, description, category, and images | Drawer form pattern, shadcn form inputs, category API shape |
| PROD-02 | Owner can define variants per product (e.g., Size: S/M/L, Color: Red/Blue) each with own SKU, barcode, price, and cost | Nested product→variant UI, repeatable variant rows, uniqueness validation |
| PROD-03 | Owner can edit and archive products and variants | Table actions, destructive dialog pattern, optimistic mutations |
| PROD-04 | Owner can organize products into categories (create, edit, reorder categories) | Category CRUD drawer, sortable/table-first admin surface |
| PROD-05 | Owner can assign or generate barcodes for each variant | Variant form validation, barcode field helpers, uniqueness checks |
| PROD-06 | Owner can bulk import products and variants via CSV or Excel file | Spreadsheet parser/writer, row validation, import preview/error summary |
| RPT-01 | Owner can view monthly sales summary (total revenue, total orders, average order value) | Reporting query design, monthly grouping, KPI card/chart presentation |
| RPT-02 | Owner can view gross profit report (revenue minus cost of goods sold) | Cost-basis decision, aggregation query, historical cost caveat |
| RPT-03 | Owner can export reports to PDF or Excel | jsPDF/autotable for PDF, SheetJS for XLSX/CSV export |
| PLAT-05 | All monetary values displayed in Thai Baht (THB) using Intl.NumberFormat | Existing THB formatter pattern, integer satang storage, locale-safe exports |
</phase_requirements>

## Summary

This phase is mostly a **desktop ERP composition problem** on top of an already-correct data model. The repo already has owner gating, table-first POS-era UI primitives, Thai Baht formatting, and catalog/sales APIs; Phase 4 should reuse those patterns and add an ERP shell, product/category drawers, and reporting tabs rather than inventing new interaction models.

The biggest technical risk is **report accuracy**, especially gross profit. The current schema stores product variant cost as a live field, but order items do not snapshot cost at sale time, so historical profit can drift if costs change later. If the plan needs true historical gross profit, it must explicitly capture a cost basis before building the report query.

**Primary recommendation:** build an owner-only ERP shell with query-driven tables/drawers, use TanStack Query + shadcn forms for CRUD, Recharts for charts, SheetJS for CSV/XLSX import/export, and jsPDF/autotable for PDF export.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Go | 1.26.2 | Backend runtime | Pinned in `go.mod`; single-binary backend |
| chi | v5.2.5 | HTTP router | Lightweight, composable REST routing |
| pgx | v5.9.2 | PostgreSQL driver | High-performance PostgreSQL toolkit |
| sqlc | latest CLI (not pinned) | SQL→Go codegen | Type-safe queries from SQL |
| PostgreSQL | 15+ | Database | Existing ERP/POS source of truth |
| React | 19.2.5 | UI runtime | Current SPA stack in repo |
| Vite | 8.0.10 | Frontend build tool | Existing app shell and fast rebuilds |
| TanStack Router | 1.124.3 | Route tree / guards | Existing route-separated POS/ERP shell |
| TanStack Query | 5.90.10 | Server-state cache | Standard way to fetch/cache ERP data |
| @tanstack/router-plugin | 1.124.3 | Route generation | Keep generated route tree in sync |
| shadcn/ui CLI | 4.5.0 | UI component scaffold | Matches locked UI system and copy-on-demand components |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @base-ui/react | 1.4.1 | Base UI primitives | Follow the UI contract/preset |
| @radix-ui/react-dialog | 1.1.15 | Dialog primitive | Underlying destructive confirmations |
| @radix-ui/react-slot | 1.2.3 | `asChild` composition | shadcn button/sheet/dialog patterns |
| @tanstack/react-router-devtools | 1.124.3 | Route debug tooling | Dev-only route inspection |
| lucide-react | 0.536.0 | Icons | Navigation, tables, reports |
| tailwindcss | 4.1.17 | Styling | Locked styling system |
| @tailwindcss/vite | 4.1.17 | Tailwind integration | Vite build pipeline |
| class-variance-authority | 0.7.1 | Component variants | shadcn-style buttons/controls |
| clsx | 2.1.1 | Class merging | Utility styling |
| @fontsource-variable/geist | 5.2.8 | UI font | Matches UI contract |
| recharts | 3.8.1 | Charts | Reporting cards/charts |
| react-hook-form | 7.73.1 | Form state | Drawer forms and import forms |
| @hookform/resolvers | 5.2.2 | Schema resolvers | Pair RHF with Zod |
| zod | 4.3.6 | Schema validation | Product/category/import form validation |
| xlsx | 0.18.5 | Spreadsheet import/export | CSV/XLSX bulk import and Excel export |
| jspdf | 4.2.1 | PDF generation | PDF report export |
| jspdf-autotable | 5.0.7 | Tabular PDF layout | Report tables in PDF |
| dexie | 4.2.1 | IndexedDB wrapper | Keep using existing offline patterns if ERP needs cached lookups |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Query | Manual fetch + `useState` | Reimplements caching/invalidation and loading states |
| Recharts | Custom SVG/chart code | More work, weaker accessibility, harder theming |
| SheetJS | Custom CSV/XLSX parser | Breaks on edge cases and Excel compatibility |
| jsPDF/autotable | Hand-rolled PDF generation | Hard layout/Unicode/print edge cases |
| react-hook-form + Zod | Controlled inputs + ad hoc validation | More re-renders and weaker schema reuse |

**Installation:**
```bash
npm install recharts react-hook-form @hookform/resolvers zod xlsx jspdf jspdf-autotable
```

**Version verification:** current versions were checked against the registry/official repos on 2026-04-25; repo-pinned dependencies were kept for existing stack items, and current registry releases were used for libraries the phase will add.

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── erp/                 # ERP shell, tables, drawers, report widgets
├── routes/              # TanStack Router route modules
├── components/ui/       # shadcn-generated primitives
├── lib/                 # formatting, API, export helpers
└── hooks/               # query/form hooks
```

### Pattern 1: Owner-only route guard
**What:** Gate `/erp` with a `beforeLoad` check that redirects non-owners.
**When to use:** Every ERP route.
**Example:**
```tsx
// Source: frontend/src/routes/erp.tsx
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'erp',
  beforeLoad: () => {
    const session = getStoredSession()
    if (!session) throw redirect({ to: '/login' } as any)
    if (session.user.role !== 'owner') throw redirect({ to: getRedirectPath(session.user.role) } as any)
  },
})
```

### Pattern 2: Drawer-first CRUD
**What:** Use right-side sheets/drawers for create/edit forms and dialogs for archive/delete.
**When to use:** Products, variants, categories, import review.
**Example:**
```tsx
// Source: shadcn/ui docs + UI contract
<SheetContent side="right">
  <Form>...</Form>
</SheetContent>
```

### Pattern 3: Query-driven report panels
**What:** Fetch monthly summaries with TanStack Query and render KPI cards + charts from the same query result.
**When to use:** Monthly sales, gross profit, date filters.
**Example:**
```tsx
// Source: TanStack Query docs
const { data, isPending } = useQuery({
  queryKey: ['erp', 'monthly-sales', month],
  queryFn: fetchMonthlySales,
})
```

### Pattern 4: Spreadsheet import pipeline
**What:** Parse CSV/XLSX into typed rows, validate with Zod, then show a preview before write.
**When to use:** Bulk product/variant import.
**Example:**
```ts
// Source: SheetJS docs
const rows = XLSX.utils.sheet_to_json(sheet)
```

### Anti-Patterns to Avoid
- **Flat product forms:** keep Product → Variant hierarchy; do not collapse into a single item table.
- **Float money:** keep satang integers internally; format only at the edges.
- **Ad hoc report state:** do not mix local state and fetch logic; use TanStack Query.
- **Custom export engines:** do not write your own PDF/XLSX generators.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Server-state caching | Manual fetch + loading/error flags | TanStack Query | Cache invalidation and stale data are easy to get wrong |
| Report charts | Custom chart primitives | Recharts + shadcn chart | Accessibility, theming, and layout are already solved |
| Spreadsheet import/export | CSV/XLSX parser/writer | SheetJS `xlsx` | Excel compatibility and edge cases |
| PDF tables | Canvas or custom print pipeline | jsPDF + autotable | Pagination, table wrapping, and file generation |
| Form validation | Ad hoc `useState` rules | react-hook-form + Zod | Less rerendering, typed validation |

**Key insight:** ERP CRUD/reporting looks simple, but the hard parts are caching, validation, spreadsheet quirks, and print/export formatting. Existing libraries already absorb those edge cases.

## Common Pitfalls

### Pitfall 1: Gross profit uses the wrong cost basis
**What goes wrong:** reporting uses the live `variants.cost` field, so older sales change when costs are edited.
**Why it happens:** current schema stores product cost on the variant, not on the sold line item.
**How to avoid:** decide whether Phase 4 needs a historical cost snapshot; if yes, add it before implementing the report query.
**Warning signs:** profit numbers change after editing a product cost.

### Pitfall 2: PDF exports break on Thai text
**What goes wrong:** jsPDF’s default fonts do not reliably cover Thai glyphs.
**Why it happens:** PDF base fonts are limited; Unicode needs an embedded font.
**How to avoid:** embed a Thai-capable font or constrain PDFs to ASCII-only labels.
**Warning signs:** garbled boxes or missing characters in exported PDFs.

### Pitfall 3: Charts render but never show correctly
**What goes wrong:** charts collapse or clip in the ERP shell.
**Why it happens:** Recharts containers need a real height/min-height and chart tokens must match the current shadcn v3 style.
**How to avoid:** always set `min-h-*` on chart containers and use `var(--chart-*)` tokens.
**Warning signs:** blank chart panels or zero-height canvases.

### Pitfall 4: Currency is formatted inconsistently
**What goes wrong:** report totals and CRUD forms disagree on THB formatting.
**Why it happens:** using floats or ad hoc string formatting in multiple places.
**How to avoid:** keep satang integers and centralize formatting with `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })`.
**Warning signs:** rounding drift, `1,200` vs `฿1,200.00`, or decimal errors.

## Code Examples

Verified patterns from official sources:

### Query-driven ERP data
```tsx
// Source: https://tanstack.com/query/latest/docs/framework/react/overview
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

const queryClient = new QueryClient()

function MonthlySales() {
  const { data, isPending, error } = useQuery({
    queryKey: ['monthly-sales'],
    queryFn: () => fetch('/api/reports/monthly-sales').then((r) => r.json()),
  })

  if (isPending) return 'Loading...'
  if (error) return 'Error'
  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

### Recharts via shadcn chart
```tsx
// Source: https://ui.shadcn.com/docs/components/chart
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <BarChart accessibilityLayer data={chartData}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="month" tickLine={false} axisLine={false} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
  </BarChart>
</ChartContainer>
```

### Drawer form validation
```tsx
// Source: https://react-hook-form.com/get-started and https://zod.dev
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ name: z.string().min(1), sku: z.string().min(1) })

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: '', sku: '' },
})
```

### PDF export
```ts
// Source: https://github.com/parallax/jsPDF
import { jsPDF } from 'jspdf'

const doc = new jsPDF()
doc.text('Monthly Sales', 10, 10)
doc.save('monthly-sales.pdf')
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual fetch + `useState` | TanStack Query | Current app stack | Better cache/invalidation and fewer loading bugs |
| Custom chart components | shadcn chart + Recharts v3 | Current shadcn docs | Accessible charts with built-in theming |
| CSV-only import | SheetJS `xlsx` for CSV/XLSX | Current spreadsheet ecosystem | One parser for both upload formats |
| Raw PDF canvas/print hacks | jsPDF + autotable | Current client-side export practice | More reliable tables and paging |

**Deprecated/outdated:**
- Flat product schemas: replaced by Product → Variant modeling.
- Float-based money formatting: replaced by integer satang + locale formatting.

## Open Questions

1. **What is the cost basis for gross profit?**
   - What we know: variants store a live `cost`, but order items do not snapshot cost at sale time.
   - What's unclear: whether Phase 4 should report historical gross profit or an approximate current-cost version.
   - Recommendation: decide before planning the reporting query.

2. **Should PDF exports include Thai text or just numbers/English labels?**
   - What we know: the app is THB-only and product names may be Thai.
   - What's unclear: whether PDF exports must preserve Thai glyphs.
   - Recommendation: if yes, embed a Thai-capable font.

3. **Are exports filtered by the same ERP query state?**
   - What we know: date range / category filters are discretionary.
   - What's unclear: whether exports should honor current filters or export the full dataset.
   - Recommendation: keep export actions bound to the active report query.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Go `testing` (current) + Vitest (needed for ERP UI, not yet configured) |
| Config file | none for frontend; Go tests use `*_test.go` conventions |
| Quick run command | `go test ./...` |
| Full suite command | `go test ./...` + `cd frontend && npm exec vitest run` after Wave 0 |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROD-01 | Product create drawer validates required fields and submits the product payload | frontend integration | `cd frontend && npm exec vitest run src/erp/**/__tests__/*` | ❌ |
| PROD-02 | Variant editor supports nested variants, SKU/barcode, price, and cost | frontend integration | `cd frontend && npm exec vitest run src/erp/**/__tests__/*` | ❌ |
| PROD-03 | Archive/edit actions open the right dialog/sheet and call the API | frontend integration | `cd frontend && npm exec vitest run src/erp/**/__tests__/*` | ❌ |
| PROD-04 | Category create/edit/reorder flows preserve tree relationships | frontend integration | `cd frontend && npm exec vitest run src/erp/**/__tests__/*` | ❌ |
| PROD-05 | Variant barcode input enforces uniqueness and generation paths | unit/integration | `go test ./internal/catalog -run TestBarcode` | ❌ |
| PROD-06 | Spreadsheet import parses CSV/XLSX and reports row errors | integration | `cd frontend && npm exec vitest run src/erp/**/__tests__/*` | ❌ |
| RPT-01 | Monthly sales summary aggregates revenue, order count, and AOV | backend integration | `go test ./internal/reporting -run TestMonthlySalesSummary` | ❌ |
| RPT-02 | Gross profit report computes revenue minus COGS with explicit cost basis | backend integration | `go test ./internal/reporting -run TestGrossProfit` | ❌ |
| RPT-03 | PDF/XLSX exports produce valid files with expected headers/totals | integration | `go test ./internal/reporting -run TestExport` | ❌ |
| PLAT-05 | THB formatting is consistent everywhere | unit | `go test ./... -run TestFormatTHB` | ❌ |

### Sampling Rate
- **Per task commit:** `go test ./...` for backend changes; once Vitest exists, run the smallest matching frontend spec.
- **Per wave merge:** backend `go test ./...` plus ERP UI Vitest suite.
- **Phase gate:** full backend + frontend green before verification.

### Wave 0 Gaps
- [ ] `frontend/vitest.config.ts` — missing frontend test runner config.
- [ ] `frontend/src/test/setup.ts` — missing shared test setup.
- [ ] `frontend/src/erp/**/*.test.tsx` — missing ERP UI coverage for drawers, tables, and tabs.
- [ ] `internal/reporting/` package — missing reporting implementation + tests.
- [ ] `frontend/package.json` test script — missing `vitest` command wiring.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/04-erp-management-reporting/04-CONTEXT.md` - locked layout, scope, and user constraints
- `.planning/ROADMAP.md` / `.planning/REQUIREMENTS.md` - Phase 4 goals and requirement IDs
- `frontend/src/routes/__root.tsx`, `frontend/src/routes/erp.tsx` - current TanStack Router guard pattern
- `frontend/src/lib/api.ts`, `frontend/src/lib/formatCurrency.ts` - current API and THB formatting patterns
- `frontend/src/pos/layout/PosLayout.tsx` - existing layout composition patterns
- `go.mod`, `frontend/package.json` - pinned versions for the current stack
- https://tanstack.com/query/latest/docs/framework/react/overview - server-state behavior and query usage
- https://ui.shadcn.com/docs/components/chart - chart component behavior and Recharts v3 note
- https://react-hook-form.com/get-started - RHF form behavior
- https://zod.dev - schema validation and TS inference
- https://github.com/parallax/jsPDF - PDF generation and Unicode caveat
- https://github.com/SheetJS/sheetjs - spreadsheet import/export support
- https://github.com/go-chi/chi - router patterns and route grouping
- https://github.com/jackc/pgx - PostgreSQL driver/toolkit
- https://docs.sqlc.dev/en/stable/ - SQL-to-Go codegen behavior
- https://github.com/golang-migrate/migrate - migration workflow and two-file convention

### Secondary (MEDIUM confidence)
- npm registry version checks on 2026-04-25 for React, TanStack, Recharts, RHF, Zod, SheetJS, and jsPDF packages

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - pinned repo versions plus official docs/README verification
- Architecture: HIGH - current repo routes/layouts already establish the patterns
- Pitfalls: MEDIUM - strongest risk is gross-profit cost basis and PDF Thai-font handling

**Research date:** 2026-04-25  
**Valid until:** 2026-05-25

# Coding Conventions

**Analysis Date:** 2026-05-02

## Naming Patterns

**Files:**
- React components use `PascalCase` filenames such as `frontend/src/erp/layout/ErpLayout.tsx`, `frontend/src/erp/tables/ProductTable.tsx`, and `frontend/src/components/ui/button.tsx`.
- Hooks use `use*` filenames such as `frontend/src/pos/hooks/useCart.ts`, `frontend/src/pos/hooks/useSync.ts`, and `frontend/src/hooks/useAuth.ts`.
- Route modules use TanStack Router names like `frontend/src/routes/erp.index.tsx`, `frontend/src/routes/pos.scan.tsx`, and `frontend/src/routes/__root.tsx`.

**Functions:**
- Use `camelCase` for functions and helpers (`formatCurrency`, `mergeReportingRows`, `buildReportExportFilename`).
- Use `PascalCase` for React components (`ErpLayout`, `ReportDashboard`, `ProductDrawer`).
- Prefix hook functions with `use` and keep them side-effect focused (`useCart`, `useAuth`, `useBarcodeDetector`).

**Variables:**
- Prefer descriptive `camelCase` names (`selectedCategory`, `archiveBusy`, `syncTimeoutRef`).
- Boolean state follows `is*` / `has*` naming (`isOnline`, `isScanning`, `hasRole`).

**Types:**
- Use `PascalCase` for interfaces and aliases (`CatalogProductRecord`, `ReportExportPayload`, `AuthUser`).
- Keep request/response types near their API module (`frontend/src/lib/api.ts`, `frontend/src/lib/erp-api.ts`, `frontend/src/lib/reporting-api.ts`).

## Code Style

**Formatting:**
- The dominant style is single quotes, 2-space indentation, trailing commas in multiline structures, and no semicolons.
- JSX props and object literals are wrapped conservatively; long class strings stay inline when readable (`frontend/src/erp/layout/ErpLayout.tsx`, `frontend/src/components/ui/button.tsx`).
- `frontend/src/routes/pos.tsx` still contains double quotes and semicolons; keep new code aligned to the prevailing single-quote style.

**Linting:**
- ESLint is configured in `frontend/eslint.config.js` with `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`.
- `frontend/src/routes/pos.tsx` explicitly disables `react-refresh/only-export-components` with a file-level comment.

## Import Organization

**Order:**
1. External packages (`react`, `@tanstack/*`, `lucide-react`, libraries).
2. Internal `@/` alias imports.
3. Relative imports for sibling route/layout modules.

**Path Aliases:**
- Use `@/*` as the only path alias, mapped in `frontend/tsconfig.json` and `frontend/vitest.config.ts`.
- Prefer alias imports for shared code (`@/lib/api`, `@/lib/auth`, `@/components/ui/button`) and relative imports only within tightly coupled route folders.

## Error Handling

**Patterns:**
- API clients wrap failed fetches in custom error classes (`ApiError`, `ReportingApiError`, `ErpApiError`) with a `status` field in `frontend/src/lib/api.ts`, `frontend/src/lib/reporting-api.ts`, and `frontend/src/lib/erp-api.ts`.
- JSON parsing is guarded with `safeParseJSON()` try/catch helpers in the API modules.
- UI and hooks generally favor early returns over nested branching (`frontend/src/pos/hooks/useSync.ts`, `frontend/src/lib/auth.ts`).
- Session helpers clear invalid storage automatically in `frontend/src/lib/auth.ts` rather than propagating bad state.

## Logging

**Framework:** `console`

**Patterns:**
- Logging is minimal and localized to barcode and scanner flows in `frontend/src/pos/hooks/useBarcodeDetector.ts`.
- Use `console.warn`, `console.debug`, or `console.error` only for transient device/runtime diagnostics; avoid broad app logging elsewhere.

## Comments

**When to Comment:**
- Comments are used sparingly for non-obvious behavior, runtime fallbacks, and intentional tradeoffs.
- Prefer comments in low-level utility and device code (`frontend/src/pos/hooks/useBarcodeDetector.ts`) over UI components.

**JSDoc/TSDoc:**
- Present in utility modules such as `frontend/src/lib/formatCurrency.ts` for public helpers and deprecation notes.
- Keep documentation close to exported helpers; avoid comment noise inside component render trees.

## Function Design

**Size:**
- Small helpers are preferred; large modules are decomposed into focused functions (`buildProductPayload`, `fetchProducts`, `normalizeProductDraft`, `exportPdfReport`).

**Parameters:**
- Use object parameters when a function needs named fields or may grow (`buildReportExportFilename(format, title, rows)` still uses ordered scalars where the signature stays small).
- Keep React component props typed inline or via `type ...Props` near the component.

**Return Values:**
- Prefer explicit return types for public helpers (`formatCurrency(amount: number): string`).
- Hooks return a single object with stable method names (`useCart`, `useAuth`, `useBarcodeDetector`).

## Module Design

**Exports:**
- Default exports are uncommon; modules usually use named exports for components, hooks, and helpers (`frontend/src/lib/utils.ts`, `frontend/src/erp/reports/exportReport.ts`).
- API modules export a namespace-like object (`api`, `reportingApi`) plus lower-level helper functions.

**Barrel Files:**
- Barrel files are not used; import directly from the owning module path.

---

*Convention analysis: 2026-05-02*

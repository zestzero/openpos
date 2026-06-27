# Coding Conventions

**Analysis Date:** 2026-06-27

## Naming Patterns

**Files:**
- Go backend files use domain folders under `internal/` and `cmd/server/` (`internal/sales/service.go`, `internal/auth/handler.go`, `cmd/server/bootstrap.go`).
- Frontend files use feature folders under `frontend/src/` (`frontend/src/pos/hooks/useCart.ts`, `frontend/src/erp/layout/ErpLayout.tsx`, `frontend/src/routes/login.tsx`).
- Tests use `*_test.go` in Go and `__tests__/*.test.ts(x)` in the frontend (`internal/sales/service_test.go`, `frontend/src/routes/__tests__/login.test.tsx`).

**Functions:**
- Go constructors use `NewX` (`NewHandler`, `NewService`, `NewOrderStore`) and service methods use verb-first names (`CreateOrder`, `CompletePayment`).
- React hooks use `useX` (`useAuth`, `useCart`, `useRbac`, `useNetworkStatus`).
- Test-only helpers use `newX`, `fakeX`, or `__reset...ForTests` (`newFakeInventoryQueries`, `fakeReportingQueries`, `__resetCartStoreForTests`).

**Variables:**
- Use short, lowerCamelCase locals in Go and TypeScript (`svc`, `req`, `rr`, `queryClient`, `cartItems`).
- Reserve `mocks` / `fake...` for test doubles (`frontend/src/routes/__tests__/login.test.tsx`, `internal/reporting/service_test.go`).

**Types:**
- Exported Go types are PascalCase and often mirror API payloads (`AuthResponse`, `CompletePaymentInput`, `ReceiptSnapshot`).
- Frontend shared DTOs are PascalCase interfaces and type aliases in `frontend/src/lib/*.ts` (`AuthResponse`, `ProductWithVariants`, `UserRole`).

## Code Style

**Formatting:**
- Go uses standard `gofmt` conventions.
- Frontend TypeScript follows Prettier-like spacing and quote style, but no separate Prettier config is detected; rely on the existing formatter/linter output from `frontend/eslint.config.js`.
- Tailwind v4 styles live in `frontend/src/app.css` with `@theme` tokens and `@layer base` rules.

**Linting:**
- Frontend linting is ESLint via `frontend/eslint.config.js` and `pnpm --dir frontend lint`.
- The frontend config enables `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh` for `*.ts`/`*.tsx` files.

## Import Organization

**Order:**
1. Standard library / platform imports (`context`, `net/http`, `react`, `node:path`).
2. Third-party packages (`github.com/go-chi/chi/v5`, `@tanstack/react-query`, `vitest`).
3. Local app imports (`github.com/zestzero/openpos/...`, `@/lib/...`, `../...`).

**Path Aliases:**
- Frontend app code uses `@/` mapped to `frontend/src` in `frontend/tsconfig.json` and `frontend/vitest.config.ts`.
- Relative imports are used for nearby files inside the same feature folder (`../CartPanel`, `../hooks/useCart`).

## Error Handling

**Patterns:**
- Go code returns errors rather than panicking and wraps context with `fmt.Errorf("...: %w", err)` in service/bootstrap paths (`internal/sales/service.go`, `cmd/server/bootstrap.go`).
- Domain validation uses sentinel errors such as `ErrInvalidOrder`, `ErrInsufficientStock`, and `ErrOrderNotFound` in `internal/sales/service.go`.
- HTTP handlers translate failures with `http.Error` and status codes based on request class (`internal/auth/handler.go`).
- Frontend request helpers throw custom error classes (`ApiError` in `frontend/src/lib/api.ts`, `ErpApiError` in `frontend/src/lib/erp-api.ts`).
- Local storage and JSON parsing helpers fail closed and return empty/null values (`frontend/src/lib/auth.ts`, `frontend/src/pos/hooks/useCart.ts`).

## Logging

**Framework:** `chi` middleware logging in the backend; no dedicated frontend logger detected.

**Patterns:**
- Request logging is enabled centrally in `cmd/server/bootstrap.go` with `middleware.Logger` and recovery middleware.
- Frontend code prefers user-visible toasts and query state over app-wide logging (`frontend/src/main.tsx`, `frontend/src/hooks/useAuth.ts`).

## Comments

**When to Comment:**
- Comment intent at trust boundaries, storage edge cases, and test-only helpers (`frontend/src/pos/hooks/useCart.ts`, `internal/auth/handler.go`).
- Avoid explaining obvious control flow; keep comments for route ownership, auth assumptions, and deliberate tradeoffs.

**JSDoc/TSDoc:**
- Not widely used. Types and exported functions usually self-document through names and structural types.

## Function Design

**Size:**
- Keep handlers, hooks, and helpers small and single-purpose. Split request decoding, validation, and persistence into separate service methods when logic grows (`internal/auth/handler.go`, `frontend/src/lib/erp-api.ts`).

**Parameters:**
- Pass `context.Context` first in Go service/database calls (`internal/sales/service.go`, `internal/reporting/service.go`).
- Prefer explicit value objects for multi-field operations (`CreateOrderInput`, `AdjustStockValues`, `ProductFormValues`).

**Return Values:**
- Go returns `(value, error)` and uses zero values on error.
- Frontend async helpers return promises of typed payloads and centralize JSON parsing in shared request helpers (`frontend/src/lib/api.ts`).

## Module Design

**Exports:**
- Prefer one main exported service/hook per file plus related helper types (`frontend/src/lib/auth.ts`, `internal/sales/service.go`).
- Keep test-only exports prefixed with `__` and clearly scoped (`frontend/src/pos/hooks/useCart.ts`).

**Barrel Files:**
- Not detected as a dominant pattern. Most modules import directly from the owning file.

## Additional Conventions

- Monetary values are stored as integers (satang/cents) in both Go and frontend code (`frontend/src/lib/api.ts`, `frontend/src/pos/hooks/useCart.ts`, `internal/sales/service.go`).
- API payloads use snake_case JSON tags in Go and matching snake_case property names in TypeScript request/response models.
- Feature boundaries are explicit: POS code stays under `frontend/src/pos`, ERP code under `frontend/src/erp`, and server code under `internal/<domain>`.

---

*Convention analysis: 2026-06-27*

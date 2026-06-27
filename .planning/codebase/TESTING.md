# Testing Patterns

**Analysis Date:** 2026-06-27

## Test Framework

**Runner:**
- Go: `go test ./...` (also invoked by `mise run test` in `mise.toml`).
- Frontend: Vitest (`frontend/package.json`), configured in `frontend/vitest.config.ts`.

**Assertion Library:**
- Go `testing` package with direct `t.Fatalf`/`t.Fatal` assertions.
- Frontend uses Vitest assertions plus `@testing-library/jest-dom` matchers from `frontend/src/test/setup.ts`.

**Run Commands:**
```bash
go test ./...
pnpm --dir frontend test -- --run
mise run test
```

## Test File Organization

**Location:**
- Go tests are co-located as `*_test.go` beside production code (`internal/sales/service_test.go`, `cmd/server/bootstrap_test.go`).
- Frontend tests live under `frontend/src/**/__tests__/` and are matched by `frontend/vitest.config.ts` (`frontend/src/routes/__tests__/login.test.tsx`, `frontend/src/pos/components/__tests__/CartPanel.test.tsx`).

**Naming:**
- Go tests use `TestXxx` names and subtests via `t.Run`.
- Frontend tests use `describe('...', ...)` and `it('...', ...)` with behavior-focused names.

**Structure:**
```
internal/<domain>/*_test.go
frontend/src/<feature>/__tests__/*.test.tsx
frontend/src/<feature>/__tests__/*.test.ts
```

## Test Structure

**Suite Organization:**
- Go unit tests favor table-driven or nested subtests for edge cases (`internal/inventory/service_test.go`, `internal/sales/service_test.go`).
- Frontend tests group by feature or hook and render the real component/hook under test (`frontend/src/pos/hooks/__tests__/useCart.test.tsx`, `frontend/src/erp/__tests__/erp-shell.test.tsx`).

**Patterns:**
- Setup in `beforeEach` / `t.Cleanup`.
- Direct assertion on observable behavior: HTTP status codes, rendered text, called mock functions, stored values, returned structs.
- Use explicit failure messages in `t.Fatalf` to show expected vs actual values.

## Mocking

**Framework:**
- Go uses hand-written fakes that satisfy small interfaces (`fakeOrderStore`, `fakeInventoryQueries`, `fakeReportingQueries`).
- Frontend uses `vi.mock`, `vi.hoisted`, and `vi.importActual` for partial module mocks.

**Patterns:**
```ts
vi.mock('@/lib/api', () => ({ api: { login: mocks.loginPassword } }))
```

```go
svc := &Service{db: sqlc.New(newFakeInventoryQueries(stock))}
```

**What to Mock:**
- External boundaries: network clients, router navigation, React Query, `localStorage`, and database/query layers.
- Cross-module hooks/components when the test only checks composition or wiring (`frontend/src/routes/__tests__/pos-shell.test.tsx`).

**What NOT to Mock:**
- Pure helpers and contract builders (`frontend/src/pos/__tests__/syncContract.test.ts`).
- Small in-memory logic inside service methods when a fake store is enough.

## Fixtures and Factories

**Test Data:**
- Inline literals are the default.
- Go tests use helper builders like `uuidPtr`, `newTestService`, `newFakeInventoryQueries` (`internal/inventory/service_test.go`).
- Frontend tests use helper render functions like `renderWithQueryClient` and shared `mocks` objects (`frontend/src/routes/__tests__/login.test.tsx`).

**Location:**
- No central fixture directory detected.
- Helpers live next to the tests they support.

## Coverage

**Requirements:**
- No coverage threshold or coverage reporter config detected in `mise.toml`, `frontend/package.json`, or `frontend/vitest.config.ts`.

**View Coverage:**
```bash
go test ./... -cover
pnpm --dir frontend test -- --coverage
```

## Test Types

**Unit Tests:**
- Primary test type in both Go and frontend.
- Focus on service logic, request/response mapping, route guards, hooks, and utility functions.

**Integration Tests:**
- Present as handler/router tests using `httptest` and real router wiring (`internal/catalog/handler_test.go`, `internal/reporting/service_test.go`, `cmd/server/bootstrap_test.go`).

**E2E Tests:**
- Not detected.

## Common Patterns

**Async Testing:**
- Frontend uses `await waitFor(...)` and async module imports for lazy-loaded code paths (`frontend/src/routes/__tests__/login.test.tsx`, `frontend/src/lib/__tests__/erp-api.test.ts`).
- Go tests usually stay synchronous and call services directly with `context.Background()`.

**Error Testing:**
- Go uses `errors.Is` for sentinel errors (`internal/sales/service_test.go`, `internal/inventory/service_test.go`).
- Frontend uses status/code assertions, mock call assertions, and `expect(() => ...).toThrow()` for route guards (`frontend/src/erp/__tests__/erp-shell.test.tsx`).

## Environment Setup

- Vitest loads `frontend/src/test/setup.ts`, which installs `@testing-library/jest-dom/vitest` and cleans up after each test.
- `frontend/vitest.config.ts` uses `jsdom`, globals, and an alias to `frontend/src`.

## Practical Guidance

- Prefer one narrow fake over a large mock harness.
- Keep route/component tests focused on user-visible behavior, not implementation details.
- Add a Go test next to the service/handler when changing validation, auth, or transaction boundaries.

---

*Testing analysis: 2026-06-27*

# Testing Patterns

**Analysis Date:** 2026-05-02

## Test Framework

**Runner:**
- Vitest `4.1.5` in `frontend/package.json`.
- Config: `frontend/vitest.config.ts`.

**Assertion Library:**
- Vitest `expect` plus `@testing-library/jest-dom/vitest` matchers from `frontend/src/test/setup.ts`.

**Run Commands:**
```bash
npm test                # Run Vitest
npm test -- --watch     # Watch mode
npm test -- --coverage  # Coverage if enabled locally
```

## Test File Organization

**Location:**
- Tests live in a dedicated `__tests__` folder under feature code: `frontend/src/erp/__tests__/`.
- This repo currently keeps the test suite close to the ERP feature area instead of scattering tests across all modules.

**Naming:**
- Use `.test.ts` or `.test.tsx` suffixes, as configured in `frontend/vitest.config.ts`.

**Structure:**
```text
frontend/src/<feature>/__tests__/*.test.tsx
```

## Test Structure

**Suite Organization:**
```ts
describe('reporting dashboard', () => {
  beforeEach(() => {
    vi.mocked(reportingApi.getMonthlySales).mockResolvedValue({ data: monthlySales })
  })

  it('renders the latest monthly sales and gross profit figures in THB', async () => {
    renderDashboard()
    expect(await screen.findByText('Monthly sales and gross profit')).toBeInTheDocument()
  })
})
```

**Patterns:**
- Use `describe()` blocks with behavior-focused titles (`frontend/src/erp/__tests__/erp-shell.test.tsx`, `frontend/src/erp/__tests__/erp-import.test.tsx`).
- Prefer helper render functions when a component needs providers (`renderDashboard()` in `frontend/src/erp/__tests__/reporting.test.tsx`, `renderWithQueryClient()` in `frontend/src/erp/__tests__/erp-import.test.tsx`).
- Use `beforeEach()` for mock resets and default mock responses.
- Use `afterEach()` for cleanup or global un-stubbing (`frontend/src/erp/__tests__/erp-import.test.tsx`).

## Mocking

**Framework:**
- `vitest` mocking APIs (`vi.mock`, `vi.hoisted`, `vi.stubGlobal`, `vi.mocked`).

**Patterns:**
```ts
const getStoredSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth', () => ({ getStoredSession }))

vi.stubGlobal('fetch', fetchMock)
```

**What to Mock:**
- External network boundaries (`fetch`, API clients in `frontend/src/lib/api.ts` and `frontend/src/lib/reporting-api.ts`).
- Session helpers in `frontend/src/lib/auth.ts` when testing route guards.
- Export side effects in `frontend/src/erp/reports/exportReport.ts`.

**What NOT to Mock:**
- React Testing Library rendering and DOM queries.
- Pure formatting helpers like `formatTHB` and `buildReportExportFilename` unless the test is specifically about integration with another layer.

## Fixtures and Factories

**Test Data:**
```ts
const monthlySales = [{ month: '2026-04', order_count: 42, total_revenue: 125000, average_order_value: 2976 }]

function makeCategory(id: string, name: string) {
  return { id, name, description: '', parent_id: null, sort_order: 1 }
}
```

**Location:**
- Fixtures are inlined inside each test file (`frontend/src/erp/__tests__/reporting.test.tsx`, `frontend/src/erp/__tests__/erp-management.test.tsx`).
- There is no shared fixture directory.

## Coverage

**Requirements:**
- No repo-enforced coverage threshold detected.

**View Coverage:**
```bash
npm test -- --coverage
```

## Test Types

**Unit Tests:**
- Pure functions and helpers: `frontend/src/erp/__tests__/vitest-setup.test.ts`, `frontend/src/erp/__tests__/erp-import.test.tsx` (`generateVariantBarcode`).

**Integration Tests:**
- Component tests that wire providers, queries, and mocked APIs: `frontend/src/erp/__tests__/reporting.test.tsx` and `frontend/src/erp/__tests__/erp-shell.test.tsx`.

**E2E Tests:**
- Not used.

## Common Patterns

**Async Testing:**
```ts
expect(await screen.findByText('Monthly sales and gross profit')).toBeInTheDocument()
await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
```

**Error Testing:**
```ts
expect(() => beforeLoad?.()).toThrow()
expect(screen.getByRole('button', { name: 'Import validated rows' })).toBeDisabled()
```

**Accessibility Queries:**
- Prefer `getByRole`, `getByLabelText`, `findByRole`, and `findByText` over DOM traversal.

**State Reset:**
- Reset or clear mocks before each test and call `vi.unstubAllGlobals()` when global stubs are used.

---

*Testing analysis: 2026-05-02*

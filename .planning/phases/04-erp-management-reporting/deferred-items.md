# Deferred Items

- `frontend/src/erp/__tests__/vitest-setup.test.ts` uses global Vitest test functions without the `vitest` type definitions in `tsconfig.app.json`, so `tsc -b` reports missing `describe`/`it`/`expect` globals. This is pre-existing and out of scope for the ERP shell plan.
- `frontend/src/erp/__tests__/erp-management.test.tsx` still references missing ERP product modules, so `pnpm build` fails on an unrelated pre-existing test import. This is outside the reporting-dashboard scope.
- The worktree already contains unrelated modified files in `frontend/src/erp/tables/CategoryTable.tsx`, `frontend/src/erp/tables/ProductTable.tsx`, and `frontend/src/routes/erp.index.tsx`. They were left untouched for this plan.

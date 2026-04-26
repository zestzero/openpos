# Deferred Items

- `frontend/src/erp/__tests__/vitest-setup.test.ts` uses global Vitest test functions without the `vitest` type definitions in `tsconfig.app.json`, so `tsc -b` reports missing `describe`/`it`/`expect` globals. This is pre-existing and out of scope for the ERP shell plan.
- `frontend/src/erp/__tests__/erp-management.test.tsx` and `frontend/src/erp/__tests__/reporting.test.tsx` still reference missing ERP product/report modules, so `pnpm build` fails on unrelated pre-existing test imports. These are outside the import-workflow scope.

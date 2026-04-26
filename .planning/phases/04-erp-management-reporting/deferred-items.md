# Deferred Items

- `frontend/src/erp/__tests__/vitest-setup.test.ts` uses global Vitest test functions without the `vitest` type definitions in `tsconfig.app.json`, so `tsc -b` reports missing `describe`/`it`/`expect` globals. This is pre-existing and out of scope for the ERP shell plan.

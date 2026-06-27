# Codebase Concerns

**Analysis Date:** 2026-06-27

## Tech Debt

**Barcode scanner lifecycle:**
- Issue: `frontend/src/pos/hooks/useBarcodeDetector.ts` stops the detection loop after the first read and the debounce timeout has no restart work, so the scanner can look active while no further codes are detected.
- Files: `frontend/src/pos/hooks/useBarcodeDetector.ts`, `frontend/src/pos/components/BarcodeScanner.tsx`
- Impact: repeated scans require a remount or manual restart; the camera flow is easy to misread as working when it is stalled.
- Fix approach: make the post-scan path explicitly restart or explicitly stop the scanner, then cover the native path in `frontend/src/pos/hooks/__tests__/useBarcodeDetector.test.tsx`.

**Inventory write path is not atomic at the service layer:**
- Issue: `internal/inventory/service.go` reads stock, checks availability, then inserts a ledger entry in separate steps.
- Files: `internal/inventory/service.go`, `internal/sales/service.go`
- Impact: concurrent decrements can pass the pre-check and still oversell stock under load.
- Fix approach: move the check-and-write into one transactional path with locking or a database-side constraint.

**Browser import flow does all parsing in one shot:**
- Issue: `frontend/src/erp/import/ImportDrawer.tsx` loads the entire CSV/XLSX into memory through `ExcelJS` before any submit happens.
- Files: `frontend/src/erp/import/ImportDrawer.tsx`, `frontend/src/erp/__tests__/erp-import.test.tsx`
- Impact: large imports can freeze the UI and spike memory usage.
- Fix approach: cap file size/row count or move parsing to a worker/server path.

## Known Bugs

**Camera scan works once, then stalls:**
- Symptoms: after one successful read, the scanner UI can still show as live while additional reads never arrive.
- Files: `frontend/src/pos/hooks/useBarcodeDetector.ts`, `frontend/src/pos/components/BarcodeScanner.tsx`
- Trigger: any successful camera scan path.
- Workaround: restart the scanner component.

## Security Considerations

**Bearer token stored in browser storage:**
- Risk: `frontend/src/lib/auth.ts` persists the access token in `localStorage`, so any XSS in the origin can read it.
- Files: `frontend/src/lib/auth.ts`, `frontend/src/hooks/useAuth.ts`, `frontend/src/routes/__root.tsx`, `frontend/src/routes/index.tsx`, `frontend/src/routes/pos.tsx`, `frontend/src/routes/erp.tsx`
- Current mitigation: protected APIs still validate the JWT in `internal/middleware/auth.go`.
- Recommendations: prefer an httpOnly cookie flow for the session token, and keep route guards as a UI convenience only.

**JWT middleware does not pin the expected signing method:**
- Risk: `internal/middleware/auth.go` relies on `jwt.ParseWithClaims` without an explicit `SigningMethodHS256` check.
- Files: `internal/middleware/auth.go`, `internal/auth/service.go`
- Current mitigation: tokens are issued with HS256 in `internal/auth/service.go`.
- Recommendations: reject unexpected algorithms before claims are trusted; use typed context keys instead of raw strings.

## Performance Bottlenecks

**Client-side spreadsheet parsing is heavy:**
- Problem: `frontend/src/erp/import/ImportDrawer.tsx` parses and normalizes the full workbook on the main thread.
- Files: `frontend/src/erp/import/ImportDrawer.tsx`
- Cause: `ExcelJS` work happens before validation or submission can be chunked.
- Improvement path: workerize parsing or impose a practical upload ceiling.

## Fragile Areas

**Inventory service:**
- Files: `internal/inventory/service.go`, `internal/inventory/service_test.go`
- Why fragile: stock is derived from the ledger, but writes are still separated from the availability check.
- Safe modification: keep stock mutation inside one transactional boundary and add concurrency tests.
- Test coverage: `internal/inventory/service_test.go` covers happy paths and simple rejects, not concurrent contention.

**Auth middleware and session helpers:**
- Files: `internal/middleware/auth.go`, `frontend/src/lib/auth.ts`, `frontend/src/hooks/useAuth.ts`
- Why fragile: request identity is carried through untyped context keys and browser storage.
- Safe modification: centralize claim extraction and context keys; keep all session reads behind one helper.
- Test coverage: login flows are covered elsewhere, but the middleware/session boundary is thinly tested.

## Scaling Limits

**Large inventory imports:**
- Current capacity: bounded mainly by browser memory and main-thread time.
- Limit: wide spreadsheets can degrade the entire ERP tab.
- Scaling path: stream rows or offload parsing.

**Concurrent stock changes:**
- Current capacity: works for low contention.
- Limit: race windows appear once multiple writes hit the same variant at the same time.
- Scaling path: row locks or a single database mutation that checks stock atomically.

## Dependencies at Risk

- Not detected.

## Missing Critical Features

- Not detected.

## Test Coverage Gaps

**Barcode scanner lifecycle:**
- What's not tested: the native `BarcodeDetector` path, post-scan restart behavior, and repeated reads.
- Files: `frontend/src/pos/hooks/useBarcodeDetector.ts`, `frontend/src/pos/components/BarcodeScanner.tsx`, `frontend/src/pos/hooks/__tests__/useBarcodeDetector.test.tsx`
- Risk: the current loop can regress silently because the existing test only asserts the `html5-qrcode` fallback.
- Priority: High

**JWT middleware:**
- What's not tested: explicit signing-method rejection and context propagation through `internal/middleware/auth.go`.
- Files: `internal/middleware/auth.go`, `cmd/server/bootstrap.go`
- Risk: auth hardening changes are easy to break without a direct middleware test.
- Priority: Medium

**Inventory contention:**
- What's not tested: concurrent decrements and simultaneous adjustments against the same variant.
- Files: `internal/inventory/service.go`, `internal/inventory/service_test.go`
- Risk: a race can oversell stock even when the single-threaded tests pass.
- Priority: High

**Browser import scale:**
- What's not tested: large workbook behavior and UI responsiveness during parse.
- Files: `frontend/src/erp/import/ImportDrawer.tsx`, `frontend/src/erp/__tests__/erp-import.test.tsx`
- Risk: import performance issues appear only with real production-sized files.
- Priority: Medium

---

*Concerns audit: 2026-06-27*

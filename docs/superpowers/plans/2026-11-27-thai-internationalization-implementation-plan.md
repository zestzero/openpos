# Thai internationalization implementation plan

## Goal

Implement the approved Thai internationalization design in `docs/superpowers/specs/2026-11-27-thai-internationalization-design.md`. Translate the full frontend with Thai default, English fallback, runtime switching, persisted preference, fixed THB formatting, and focused coverage. No backend or dependency changes.

## Decisions

- Build a small typed in-house i18n module under `frontend/src/lib/i18n/`; do not add `i18next` or another runtime dependency.
- Use a React provider/hook mounted in `frontend/src/main.tsx`; keep translation resources module-level and stable.
- Persist only `th` or `en` in a versioned local-storage key. Thai is the fallback/default; do not use browser negotiation.
- Add a shared `LanguageSwitcher` used by login, POS shell, and ERP shell.
- Keep `frontend/src/lib/formatCurrency.ts` unchanged as the fixed `th-TH`/THB formatter. Add separate helpers for active-locale dates and non-money numbers.
- Preserve all route paths, API payloads, domain enums, offline queue contracts, cart/form state, and server-provided catalog/user data.
- Delete the old `VITE_POS_LOCALE` selection and local POS/inventory dictionaries once all callers use the shared translator.

## Implementation slices

### 1. Add the typed i18n runtime and tests

Files:

- Add `frontend/src/lib/i18n/types.ts` or equivalent typed resource contract.
- Add `frontend/src/lib/i18n/resources.ts` with complete `en` and `th` resources.
- Add `frontend/src/lib/i18n/i18n.ts` for locale storage, fallback, interpolation, and formatting helpers.
- Add `frontend/src/lib/i18n/I18nProvider.tsx` and hook exports.
- Add focused tests under `frontend/src/lib/i18n/__tests__/`.
- Update `frontend/src/main.tsx` to mount the provider above the router.

Work:

- Define semantic namespaced keys and enforce `th`/`en` key parity at compile time where practical.
- Implement safe named interpolation and English fallback for missing entries.
- Implement valid stored-locale parsing, default Thai initialization, and persistence.
- Implement non-money number/date helpers using the active locale.
- Add test-only provider setup utilities if needed; never make test mode implicitly English.

Acceptance:

- Fresh storage renders Thai; valid stored `en` renders English; invalid values resolve to Thai.
- Switching locale updates subscribers immediately and survives a reload.
- Interpolation never leaves an unresolved placeholder in normal output.
- Currency remains exactly the existing fixed THB behavior in both locales.

### 2. Add the language switcher and migrate shared/auth surfaces

Files:

- Add `frontend/src/components/LanguageSwitcher.tsx`.
- Update `frontend/src/routes/login.tsx`.
- Update shared UI only where needed for labels passed into controls.
- Update `frontend/src/routes/__tests__/login.test.tsx` and add switcher tests.

Work:

- Provide an accessible two-option language control with active selection.
- Translate login/register tabs, labels, placeholders, errors, loading text, and submit states.
- Render the switcher on login without changing auth behavior or form values.
- Verify switching locale preserves entered credentials and registration mode.

Acceptance:

- Login is fully usable in Thai and English.
- The switcher has localized accessible labels and changes the page without navigation/reload.
- Existing registration visibility and redirect tests continue to pass.

### 3. Migrate POS and remove duplicate locale handling

Files:

- `frontend/src/pos/**`
- `frontend/src/routes/pos.tsx`
- `frontend/src/routes/pos.inventory.tsx`
- POS-focused tests under `frontend/src/pos/__tests__/` and `frontend/src/routes/__tests__/`.
- Remove or replace `frontend/src/pos/lib/copy.ts` after callers migrate.

Work:

- Move existing POS Thai/English strings into shared namespaced resources, preserving approved Thai wording and English fallback wording.
- Convert POS inventory's local dictionary and reason labels to shared translation keys.
- Translate all visible text, toast/error text, dialog descriptions, scanner states, image alt text, placeholders, and ARIA labels.
- Render the language switcher in `PosHeader` or the existing POS shell without reducing phone usability.
- Keep cart, checkout, PromptPay, receipt replay, sync queue behavior, client UUIDs, and offline delta semantics unchanged.

Acceptance:

- POS defaults to Thai and can switch to English on every POS route.
- Cart/checkout/inventory state survives switching.
- No POS component reads `VITE_POS_LOCALE`, `posLocale`, or a duplicate local dictionary.
- Existing POS behavior tests pass in explicit locale contexts.

### 4. Migrate ERP navigation, layout, pages, and export/receipt copy

Files:

- `frontend/src/erp/navigation/ErpNav.tsx`
- `frontend/src/erp/layout/ErpLayout.tsx`
- `frontend/src/erp/dashboard/**`
- `frontend/src/erp/products/**`
- `frontend/src/erp/categories/**`
- `frontend/src/erp/import/**`
- `frontend/src/erp/inventory/**`
- `frontend/src/erp/reports/**`
- `frontend/src/erp/settings/**`
- `frontend/src/erp/tables/**`
- `frontend/src/lib/receipt.ts`
- `frontend/src/erp/reports/exportReport.ts`
- Existing ERP tests plus focused tests for language switching and representative pages.

Work:

- Replace hardcoded labels, headings, descriptions, filters, table headers, drawer content, validation/error/empty/loading states, and accessible attributes with translation calls.
- Add the switcher to the ERP shell; preserve search, POS handoff, logout, and navigation behavior.
- Pass translated labels into report/export/receipt utilities explicitly; do not couple non-React utilities to context.
- Replace English-only report count/date formatting with active-locale non-money helpers while preserving fixed THB values.
- Keep product/category/user names and imported data as supplied by users/API.

Acceptance:

- Every normal ERP route has Thai and English copy, including dialogs, filters, reports, settings, import, and exports.
- Switching language preserves route, query/filter state, open drawer state where possible, and form values.
- No user-facing English literals remain outside translation resources, except allowed user/server data and technical identifiers.
- ERP layouts remain usable at current responsive breakpoints.

### 5. Audit, test, and clean up

Files:

- All changed frontend files.
- Translation resource/test files.
- `docs/superpowers/specs/2026-11-27-thai-internationalization-design.md` and this plan if implementation discoveries require clarification.

Work:

- Run a targeted source audit for hardcoded user-facing strings, `aria-label`, `placeholder`, `title`, `alt`, report/export text, and `toLocaleString('en-US')` usage.
- Remove obsolete POS locale environment handling and dead dictionary exports.
- Add missing translations discovered by the audit; do not weaken tests by asserting only that text exists.
- Check Thai text at 320px POS width and verify accessible names in both locales.

Verification:

- `pnpm --dir frontend test -- --run`.
- `pnpm --dir frontend build`.
- `pnpm --dir frontend lint`.
- If a focused failure is isolated during implementation, rerun that focused test after the fix, then run the final frontend checks once after the last edit.

## Risks

- Resource key growth can become an unreviewable monolith. Keep namespaces aligned with frontend domains and use one resource module per domain if the file becomes difficult to navigate.
- Context-driven rerenders can be expensive. Keep resource objects static and return stable memoized translator/formatter functions.
- Export and receipt utilities cannot consume React context directly. Their callers must pass locale/copy explicitly.
- Existing tests may implicitly depend on test-mode English. Make locale explicit in test providers and update assertions to the intended user-visible contract.
- Thai translations can expose layout assumptions. Treat clipped labels, horizontal overflow, and missing accessible names as implementation failures, not translation exceptions.

## Out of scope

- Go handlers, PostgreSQL, migrations, sqlc, API response localization, currency conversion, product data translation, and offline protocol changes.

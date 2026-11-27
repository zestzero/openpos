# Thai internationalization design

## Goal

Add a shared internationalization system for the entire OpenPOS frontend. Thai (`th`) is the default frontline language; English (`en`) remains a supported fallback. Users can change language at runtime, and the choice persists across reloads and authenticated/unauthenticated screens. The change is frontend-only: no API, database, offline-sync, or domain-contract changes.

## Current state

- `frontend/src/pos/lib/copy.ts` already contains a Thai/English POS dictionary selected by `VITE_POS_LOCALE` and defaults to Thai outside tests.
- `frontend/src/routes/pos.inventory.tsx` has a second local Thai/English dictionary.
- Login, ERP navigation/layout, ERP pages, accessibility labels, error messages, report labels, and export text are mostly hardcoded in English.
- `frontend/src/lib/formatCurrency.ts` already formats satang as THB with `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })`. That Thai-baht currency contract remains fixed regardless of selected UI language.
- Frontend uses React 19, Vite, TanStack Router/Query, Vitest, and Testing Library. No i18n dependency is installed.

## Design

### Typed shared translation resources

Create `frontend/src/lib/i18n/` with:

- a typed translation schema covering shared, auth, POS, ERP, validation/error, report, receipt, and accessibility copy;
- complete `en` and `th` resource objects with matching keys;
- a `Locale` union (`'th' | 'en'`), default locale `th`, and English fallback for defensive handling of missing entries;
- a small `t(key, variables?)` formatter supporting named interpolation for counts, product names, amounts, and error context;
- locale-aware helpers for non-money numbers and dates;
- a React provider/hook that supplies the active locale and translator to all routes/components.

Keep translation keys semantic and namespaced. Do not use English text as lookup keys. Keep API/domain enum values, route paths, product data, reason codes, and stored business values unchanged.

### Locale lifecycle

- Initialize from a versioned local-storage key, for example `openpos.locale`.
- If no valid stored locale exists, use Thai. Do not silently infer a different default from the browser because Thai is the product default.
- Expose `setLocale` through the provider and persist only the supported `th`/`en` values.
- Mount the provider in `frontend/src/main.tsx` above the router so login, POS, ERP, dialogs, toasts, and error boundaries can use one locale.
- Remove `VITE_POS_LOCALE` as a runtime source of truth after POS migration. Tests must set locale explicitly through the provider or local storage rather than relying on test-mode English defaults.

### Language switcher

Add a small shared `LanguageSwitcher` component. Render it on the login surface and in the authenticated POS/ERP shells. It must:

- have a visible accessible label;
- expose Thai and English choices with the current locale selected;
- update visible copy immediately without a full reload;
- preserve the current route, form state, cart, and offline queues;
- use Thai labels for the Thai choice and English labels for the English choice;
- remain usable at the POS phone width and in the ERP header.

### Frontend migration coverage

Migrate all user-facing frontend copy, not just headings:

- login/register modes, fields, validation, auth errors, and loading states;
- POS shell, catalog, search, scanner, cart, checkout, PromptPay, receipt replay, offline/sync status, inventory adjustment, dialogs, button labels, and ARIA names;
- ERP navigation, header, dashboard, products, categories, import, inventory, reports, settings/users, empty/loading/error states, table headings, filters, drawer labels, and confirmations;
- report chart labels, CSV/XLSX/PDF export labels, receipt/reprint text, and generated timestamps where user-facing;
- image/file upload hints, barcode labels, and all `placeholder`, `title`, `alt`, `aria-label`, and live-region text.

Use translation functions at render boundaries. Keep server-provided product/category/user names untranslated. Keep technical identifiers, SKU/barcode values, and user-entered values unchanged.

### Formatting

- Keep monetary display fixed to the existing Thai-baht formatter in `frontend/src/lib/formatCurrency.ts`: `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })`.
- Apply the active locale only to non-money numbers, dates/times, relative status text, and translated interpolation where appropriate.
- Replace hardcoded `toLocaleString('en-US')` report counts/timestamps with shared non-money formatting helpers.
- Do not change satang/cents storage or API values.

## Behavior and accessibility

- Thai is complete enough to use every normal sales, inventory, login, and ERP workflow without English-only controls.
- Every translated interactive control retains a stable accessible name in the active locale; icon-only controls receive translated labels.
- Switching language does not reset route state, query state, cart state, selected variants, dialogs, or offline queues.
- Missing translation keys fall back to English and are detectable in development/tests; no raw key should appear in normal production UI.
- Long Thai labels must wrap or truncate within existing mobile/desktop layouts without horizontal scrolling at 320px POS width.

## Testing design

Add focused tests for:

- locale initialization, valid/invalid persistence, Thai default, runtime switching, and English fallback;
- interpolation and non-money number/date formatting;
- fixed THB currency formatting independent of active UI locale;
- language switcher accessible names, selected state, persistence, and immediate rerender;
- login, POS, POS inventory, ERP navigation, representative ERP pages, reports/export labels, and receipt/replay copy in both locales;
- translated ARIA labels/placeholders and error/empty/loading states;
- preservation of cart/form/route state while switching locale.

Use accessible roles and visible behavior rather than asserting implementation details or raw resource object shapes.

## Risks and constraints

- The existing POS dictionaries and local inventory dictionary can drift from the new schema. Migrate both in one pass and delete obsolete locale selection code.
- The ERP surface contains many hardcoded strings across nested components; a coverage inventory is required to avoid a partially translated shell.
- A context/provider rerender can affect large POS/ERP trees. Keep resources module-level, use stable translator references per locale, and avoid recreating dictionaries per render.
- Thai text is often longer or shorter than English. Verify responsive layouts and accessible names after migration.
- Export libraries and receipt rendering may execute outside normal React rendering. Pass translated labels explicitly rather than reading React context from utility modules.

## Out of scope

- Backend/API localization, database schema changes, localized product/category/user data, or server-generated business messages.
- Currency conversion or changing the fixed THB display convention.
- Automatic browser-language negotiation.
- Pluralization beyond the interpolation behavior required by current copy; add only if a concrete screen needs it.
- Translating developer logs, test descriptions, route IDs, enum values, SKU/barcode data, or source comments.

# Shared ERP dropdown implementation plan

## Goal

Implement the approved design in `docs/superpowers/specs/2026-11-27-dropdown-design.md`: add a small controlled form-select wrapper over the existing Base UI primitive, migrate all seven native ERP single-choice controls, and cover behavior with focused accessible interaction tests. No dependency changes, POS changes, Storybook, or unrelated design-system work.

## Decisions

- Add `frontend/src/components/ui/form-select.tsx` next to the existing `select.tsx`; do not replace or restructure the lower-level primitive exports.
- Keep the wrapper's public contract narrow: string-valued options, controlled selection and change callback, optional blank-choice configuration, `disabled`, trigger `id`/ARIA labeling, and trigger class extension. Use the existing theme tokens and primitive composition.
- Preserve caller state/API semantics. For product category and parent category, public blank selection maps to `null`; all other values stay exactly as currently stored (`owner`/`cashier`, filters, time ranges, and reason codes).
- Use an internal Base UI-compatible value for the blank item, but make it collision-safe against the provided option values and translate it at the wrapper boundary. Never pass that internal value to a consumer. Cover this contract in wrapper tests.
- Preserve current labels, option text and ordering, defaults, filtering/mutation behavior, disabled conditions, and surrounding layout. Adjustment reason receives a visible programmatic label as required by the approved spec.
- Use the existing ERP tests: `frontend/src/erp/__tests__/erp-management.test.tsx` and `frontend/src/erp/__tests__/inventory-page.test.tsx`.

## Implementation slices

### 1. Add and test the shared wrapper

Files:
- Add `frontend/src/components/ui/form-select.tsx`.
- Add a focused wrapper test in `frontend/src/components/ui/__tests__/form-select.test.tsx` (or the established shared-component test directory if the repository's current convention differs at implementation time).

Work:
- Compose `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, and `SelectItem` from `select.tsx`.
- Define and export only the option and component types needed by consumers. Keep value type and `onValueChange` explicit; support an optional blank item without converting the parent-controlled value to a display sentinel.
- Before choosing internal empty-item representation, confirm the installed Base UI primitive's allowed item/root values from the existing dependency types/docs. If empty items require a string, generate a reserved collision-safe value from the actual option set and handle it only inside the wrapper; if the primitive supports a null-valued item directly, prefer that to avoid unnecessary sentinel logic.
- Apply established shared select styling by default; allow trigger class sizing adjustments. Forward `id`, accessible labeling props, and `disabled` to the trigger.

Acceptance:
- Controlled value is displayed; selecting a normal item invokes the callback with its original string value.
- Optional blank choice renders the configured label, maps to `null` for consumers, and never leaks or collides with any option value.
- Disabled trigger cannot be opened or changed and exposes disabled semantics.
- Option interaction and focus follow Base UI behavior; accessible name is available through forwarded label/ARIA props.

### 2. Migrate product/category drawers and user role

Files:
- `frontend/src/erp/products/ProductDrawer.tsx`
- `frontend/src/erp/categories/CategoryDrawer.tsx`
- `frontend/src/erp/settings/users/UserFormDialog.tsx`
- Update `frontend/src/erp/__tests__/erp-management.test.tsx`.

Work:
- Product Category uses the existing `No category` blank label and category order; translate blank to `null` in `draft.categoryId` and preserve existing category IDs.
- Parent category uses `No parent`; preserve filtering out the currently edited category, option order, and `draft.parentId: null` behavior.
- Role retains `Owner` then `Cashier`, current controlled role union/defaults, and immediate password/PIN conditional rendering. Keep the shorter role-trigger sizing through wrapper class extension, and connect visible `Role` label to trigger ID.
- Ensure drawer visible field labels name their triggers; remove only obsolete native-select class/style usage.

Acceptance:
- Selecting `No category` and `No parent` stores `null`; choosing category options preserves their IDs.
- Parent option list omits self while retaining other categories.
- Role changes retain conditional password/PIN behavior and selected text.
- Visible labels, keyboard selection, and disabled semantics remain accessible; drawer layout does not overflow or shift unexpectedly.

### 3. Migrate inventory controls

Files:
- `frontend/src/erp/inventory/InventoryPage.tsx`
- Update `frontend/src/erp/__tests__/inventory-page.test.tsx`.

Work:
- Migrate stock state (`all`, `low`, `zero`), adjustment reason (`reasonOptions` in existing order), ledger reason (`all` plus `reasonOptions`), and ledger time (`all`, `24h`, `7d`, `30d`) without changing state types or filtering logic.
- Preserve `All stock states`, `All reasons`, and `All time` as displayed options and preserve existing aria-labels on stock-state and ledger filters.
- Add a visible `Reason code` label associated with the reason trigger; retain disabling when no variant is selected or adjustment mutation is pending.
- Preserve full-width, 3rem inventory trigger styling without modifying global `.select-field` rules.

Acceptance:
- All four values/defaults, option labels/order, filter effects, and Clear ledger filters behavior remain unchanged.
- Reason control is inaccessible for interaction when currently disabled, then usable once a variant is selected; it disables again during pending mutation.
- Each trigger has the expected accessible name and uses keyboard-driven option selection.

## Verification

After all slices land, run only the targeted affected frontend tests (`form-select`, `erp-management`, and `inventory-page`) plus the frontend TypeScript/build check. Do not run the full test suite, add dependencies, or change backend code. If a focused test exposes a compatibility issue, fix it within these files and rerun only that affected focused check.

## Risks

- Base UI value constraints may not permit native-like empty-string values. Inspect the installed API before implementing; use a collision-safe internal sentinel only if required, or use a supported null item value directly. In either case, prove that the consumer callback receives only `null`/real values, never an implementation sentinel.
- `Select` triggers are not native `<select>` elements, so tests must use accessible roles/names and user interactions and must verify controlled rendering, keyboard support, and disabled behavior.
- Replacing native controls can affect form labeling and trigger height. Explicitly verify drawer/user labels and keep role sizing plus inventory's current dimensions scoped through wrapper classes.
- Keep conversion logic at call sites only where existing form state is nullable; do not alter API/domain value strings or add sentinel handling to domain logic.

# Shared ERP dropdown design

## Goal

Replace native single-choice `<select>` controls in ERP with one small reusable form dropdown built on the existing Base UI Select primitive. Preserve each control's existing labels, option text/order, values, controlled behavior, and business effects. Do not add a select dependency or change POS controls. The wider design-system-folder and Storybook work is a separate future planning effort.

## Current state

- `frontend/src/components/ui/select.tsx` already wraps `@base-ui/react/select` and exports `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, and `SelectValue`. Base UI is already a dependency.
- Four ERP components currently contain seven native selects:
  - `ProductDrawer`: Category (`No category`, then supplied categories); `draft.categoryId ?? ''` maps back to `null` for the no-category choice.
  - `CategoryDrawer`: Parent category (`No parent`, then all categories except the category being edited); `draft.parentId ?? ''` maps back to `null`.
  - `UserFormDialog`: Role (`Owner`, `Cashier`), controlled by the existing owner/cashier union; changing role currently reveals the matching password or PIN field.
  - `InventoryPage`: Stock state filter (`all`, `low`, `zero`); adjustment reason (the existing `reasonOptions` RESTOCK, ADJUSTMENT, RETURN, DAMAGE, LOST); ledger reason filter (`all`, then those same reason options); ledger time range (`all`, `24h`, `7d`, `30d`).
- Product and category controls are currently visually styled differently; inventory uses `.select-field` (3rem height, pill radius, card background), and user role has its own 2.5rem control. The shared primitive has a 3rem trigger with pill radius/card background, popover styling, item focus/disabled states, and a portal. Preserve the current screen layout and use existing theme tokens; do not undertake unrelated styling cleanup.
- Relevant existing component tests are in `frontend/src/erp/__tests__/erp-management.test.tsx`; inventory control coverage should be added/updated in the relevant inventory test location (create one only if none exists). The frontend uses Vitest and Testing Library.

## Design

Add a small form-oriented wrapper alongside the shared primitive, at `frontend/src/components/ui/form-select.tsx`. Its responsibility is to compose the existing Select parts into a consistently styled single-select control and accept a controlled value, change callback, option list, and disabled state. Keep it intentionally limited: no search, multi-select, async loading, domain logic, new library, generalized design-system API, or Storybook work. Keep the lower-level primitives available for other future compositions.

The wrapper must expose a string-valued controlled interface compatible with the existing fields, plus an explicit way to represent an optional blank choice. Define its public types and empty-choice mapping so callers continue to store the same values (including `null` for product/category absence) and never leak a display-only sentinel into form/API state. The implementation must use values supported by the installed Base UI primitive and must avoid collisions with actual category IDs. Each option's displayed label is also the selected value's displayed text. The wrapper forwards disabled state and supports caller-provided trigger `id`/ARIA labeling and class extension, without callers assembling primitive internals.

The wrapper should use the shared primitive's established theme styling, focus-visible treatment, popover layering, and item states. Apply sizing/class adjustments through the wrapper's class extension only where needed to avoid changing the surrounding layout; retain inventory's current full-width, 3rem treatment and the current shorter user role control where appropriate. Do not modify global `.select-field` styling for unrelated controls.

## Field behavior and accessibility

- Preserve all option values, labels, and ordering listed above, including the initial defaults and current filter-clear behavior.
- Product category and category parent retain a selectable blank choice and return `null` to their existing draft fields when selected. Parent category continues excluding the edited category.
- User role remains required, defaults and edits as today, and continues to drive conditional password/PIN fields immediately on change.
- Inventory filter values remain the existing discriminated unions and continue driving the same filters. Adjustment reason remains disabled when no variant is selected or while the mutation is pending; all other current controls remain enabled as today.
- Keep every control programmatically named. Use the visible surrounding labels for drawer fields and user role; retain the existing accessible names “Stock state filter”, “Ledger reason filter”, and “Ledger time range”. Add an explicit visible/accessible label for the adjustment reason control (currently only a visual “Reason code” span) so the custom trigger is unambiguously named. Ensure drawer field wrappers label the trigger, and the user label targets the trigger ID.
- Disabled state must be exposed to assistive technology, and keyboard operation must retain Base UI's select semantics (focus, open, navigate options, select, dismiss). Focus indication must remain visible against the existing backgrounds.

## Migration scope

Migrate all seven native ERP single-choice selects in `ProductDrawer`, `CategoryDrawer`, `UserFormDialog`, and `InventoryPage` to the shared wrapper. Remove obsolete native-select-only class/style usage from these fields only when no longer needed; do not change any text inputs, POS selects, option data, state models, mutations, or filtering logic. This slice ends after the shared wrapper and these seven migrations; broader component reorganization and Storybook are out of scope.

## Verification design

Add/update focused tests to establish:

- the wrapper renders option labels, reflects its controlled selection, emits the chosen option value, handles a blank choice without leaking an implementation sentinel, and disables the trigger/options when requested;
- product/category blank choices preserve `null`, category ordering and parent self-exclusion remain intact;
- role selection changes preserve the existing conditional password/PIN behavior;
- Inventory's four controls preserve their values, labels, defaults, clear-filter behavior, and adjustment disabled conditions.

Use accessible roles/names and user interactions in tests rather than relying on native `<select>` event semantics. The implementation plan should identify the existing inventory test file or add a focused one if none exists. Run only the focused affected frontend tests and frontend type/build checks when implementation is authorized; no backend or dependency changes are expected.

## Risks and constraints

- A custom Base UI trigger is not a native form control. Controlled updates, visible selected text, accessible naming, keyboard behavior, and disabled behavior must be verified through the component and affected screen tests.
- Empty-choice representation is the main compatibility risk: Base UI item values and root values have constraints that differ from native `<option value="">`. The wrapper must provide a collision-safe, implementation-private mapping to the existing `null`/empty semantics, and tests must prove that mapping.
- The Base UI trigger's default height differs from the user role field. Keep the visual migration scoped and ensure focus styling and responsive layout are not regressed.

## Out of scope

- Installing or replacing any select dependency.
- POS single-choice controls or non-select controls.
- API/backend/form schema changes or changing existing option values/labels.
- Searchable/multi-select controls, Storybook, or the future design-system folder effort.

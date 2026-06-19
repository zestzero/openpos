# Product and Category Navigation Split Design

## Goal

Split ERP product and category management into two separate left-navigation destinations so each workflow has a focused page and URL.

## Current State

- `/erp/products` renders `ProductManagementPage`.
- `ProductManagementPage` currently renders both `CategoryTable` and `ProductTable` in one page.
- Product creation/editing depends on category data for the category picker.
- Category creation/editing uses `CategoryDrawer` and category mutations.
- The ERP left nav currently lists Dashboard, Products, and Inventory in the Workspace group.

## Chosen Approach

Use separate top-level ERP nav items:

- `/erp/products` → product management only.
- `/erp/categories` → category management only.
- ERP left nav Workspace group becomes Dashboard, Products, Categories, Inventory.

This keeps catalog structure discoverable while avoiding nested nav work that the current navigation component does not support.

## UX Behavior

### Products Page

- Shows only the product table and product-specific controls.
- Keeps barcode/QR batch label selection and print preview on the product page.
- Product drawer still receives the category list so products can be assigned to categories.
- Product empty state remains product-focused.

### Categories Page

- Shows only the category table and category-specific controls.
- Category drawer remains available for create/edit.
- Category empty state remains category-focused.
- Category management has a stable URL at `/erp/categories`.

### Navigation

- Add a `Categories` item to the ERP left nav in the Workspace group.
- Use the same active-link behavior as other ERP nav items.
- Existing Product navigation continues to target `/erp/products`.

## Component Boundaries

- Keep `ProductTable`, `ProductDrawer`, `CategoryTable`, and `CategoryDrawer` as reusable UI units.
- Split page orchestration so product mutations/state and category mutations/state are owned by separate page components.
- Avoid backend/API changes; both pages continue using existing catalog hooks and mutations.

## Routing

- Add a TanStack route file for `erp.categories` using the same route pattern as `erp.products` and `erp.inventory`.
- Ensure the generated route tree includes `/erp/categories`.
- Existing `/erp/products` route remains unchanged for product management.

## Testing

- Update ERP shell/navigation tests to expect the Categories nav item.
- Update management tests so product and category rendering are verified independently instead of relying on both tables on one page.
- Add or update route-tree assertions for the new categories route.
- Keep existing product table, category table, drawer, and barcode/QR tests passing.

## Out of Scope

- Nested navigation groups.
- Category reordering.
- Product/category backend API changes.
- Redirects from old category URLs, because no separate category URL exists yet.
- Changes to POS category/product browsing.

## Success Criteria

- `/erp/products` displays product management without the category table.
- `/erp/categories` displays category management without the product table.
- ERP left nav includes separate Products and Categories links.
- Product create/edit still supports category assignment.
- Relevant frontend tests and build pass.

# Product Category Nav Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split ERP product and category management into separate left-nav pages at `/erp/products` and `/erp/categories`.

**Architecture:** Keep table/drawer components reusable and split page orchestration into product-only and category-only route pages. Product management keeps barcode/QR label selection and still reads categories for product assignment; category management owns category drawer state and category mutations. Add a TanStack Router route and left-nav item for Categories.

**Tech Stack:** React 19, TypeScript, TanStack Router, TanStack Query-backed ERP API hooks, Vitest + Testing Library, Vite.

---

## File Structure

- Modify `frontend/src/erp/products/ProductManagementPage.tsx`
  - Remove category table/drawer orchestration.
  - Keep product query/mutations, category query for drawer/table display, product drawer, barcode/QR dialog.
- Create `frontend/src/erp/categories/CategoryManagementPage.tsx`
  - Own category query, create/update mutations, selected category state, category drawer, and category table.
- Create `frontend/src/routes/erp.categories.tsx`
  - Register `/erp/categories` with the ERP parent route.
- Modify `frontend/src/routeTree.gen.ts`
  - Import and add `erpCategoriesRoute` to ERP children.
- Modify `frontend/src/erp/navigation/ErpNav.tsx`
  - Add a `Categories` nav item in Workspace between Products and Inventory.
  - Update active-link matching so `/erp/categories` can become active.
- Modify `frontend/src/erp/__tests__/erp-shell.test.tsx`
  - Expect Categories in persistent navigation.
  - Assert new categories route belongs to the ERP route tree.
- Modify `frontend/src/erp/__tests__/erp-management.test.tsx`
  - Add page-level tests for product-only and category-only management pages.
  - Keep existing component-level table/drawer/QR tests.

---

### Task 1: Add route and navigation tests

**Files:**
- Modify: `frontend/src/erp/__tests__/erp-shell.test.tsx`
- Modify: `frontend/src/erp/__tests__/erp-management.test.tsx`

- [ ] **Step 1: Write failing shell tests for category navigation and route**

In `frontend/src/erp/__tests__/erp-shell.test.tsx`, add the categories route import near the existing route imports:

```tsx
import { Route as erpCategoriesRoute } from '@/routes/erp.categories'
```

Update the persistent nav test to assert the new link:

```tsx
it('keeps the persistent left navigation visible', () => {
  render(<ErpNav />)

  expect(screen.getByText('Owner access only')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/erp')
  expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/erp/products')
  expect(screen.getByRole('link', { name: 'Categories' })).toHaveAttribute('href', '/erp/categories')
  expect(screen.getByRole('link', { name: 'Inventory' })).toHaveAttribute('href', '/erp/inventory')
  expect(screen.getByRole('link', { name: 'Reports' })).toHaveAttribute('href', '/erp/reports')
})
```

Add a route-tree assertion after the products route test:

```tsx
it('includes the dedicated categories route in the ERP route tree', () => {
  const categoriesRoute = erpCategoriesRoute as TestRoute

  expect(categoriesRoute.options.path).toBe('categories')
  expect(categoriesRoute.options.getParentRoute?.()).toBe(erpRoute)
})
```

- [ ] **Step 2: Write failing page split tests**

In `frontend/src/erp/__tests__/erp-management.test.tsx`, add imports for the page components near existing ERP imports:

```tsx
import { CategoryManagementPage } from '../categories/CategoryManagementPage'
import { ProductManagementPage } from '../products/ProductManagementPage'
import {
  useArchiveProductMutation,
  useArchiveVariantMutation,
  useCategoriesQuery,
  useCreateCategoryMutation,
  useCreateProductMutation,
  useCreateVariantMutation,
  useProductsQuery,
  useUpdateCategoryMutation,
  useUpdateProductMutation,
  useUpdateVariantMutation,
} from '@/lib/erp-api'
```

Add mocks below the existing QRCode mock:

```tsx
vi.mock('@/lib/erp-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/erp-api')>()
  return {
    ...actual,
    useArchiveProductMutation: vi.fn(),
    useArchiveVariantMutation: vi.fn(),
    useCategoriesQuery: vi.fn(),
    useCreateCategoryMutation: vi.fn(),
    useCreateProductMutation: vi.fn(),
    useCreateVariantMutation: vi.fn(),
    useProductsQuery: vi.fn(),
    useUpdateCategoryMutation: vi.fn(),
    useUpdateProductMutation: vi.fn(),
    useUpdateVariantMutation: vi.fn(),
  }
})
```

Add this helper near `productTableSelectionProps`:

```tsx
function mockMutation() {
  return {
    isPending: false,
    mutateAsync: vi.fn(async (value: unknown) => value),
  }
}

function mockManagementHooks() {
  vi.mocked(useCategoriesQuery).mockReturnValue({ data: [makeCategory('cat-1', 'Tea')] } as any)
  vi.mocked(useProductsQuery).mockReturnValue({ data: [makeProductRecord() as any] } as any)
  vi.mocked(useArchiveProductMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useArchiveVariantMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useCreateCategoryMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useCreateProductMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useCreateVariantMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useUpdateCategoryMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useUpdateProductMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useUpdateVariantMutation).mockReturnValue(mockMutation() as any)
}
```

Update `beforeEach` in the `ERP catalog management` describe block, or add one if missing:

```tsx
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(QRCode.toDataURL).mockImplementation(async (payload: string) => `data:image/png;base64,qr-${payload}`)
  mockManagementHooks()
})
```

Add page split tests near the top of the describe block:

```tsx
it('renders product management without category management on the products page', () => {
  render(<ProductManagementPage />)

  expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Create product' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Categories' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Create category' })).not.toBeInTheDocument()
})

it('renders category management without product management on the categories page', () => {
  render(<CategoryManagementPage />)

  expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Create category' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Products' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Create product' })).not.toBeInTheDocument()
})
```

- [ ] **Step 3: Run tests and verify they fail for missing route/page split**

Run:

```bash
cd frontend && npm run test -- --run src/erp/__tests__/erp-shell.test.tsx src/erp/__tests__/erp-management.test.tsx
```

Expected: FAIL because `@/routes/erp.categories` and `../categories/CategoryManagementPage` do not exist, or because navigation/page split has not been implemented yet.

- [ ] **Step 4: Commit tests**

```bash
git add frontend/src/erp/__tests__/erp-shell.test.tsx frontend/src/erp/__tests__/erp-management.test.tsx
git commit -m "test product category nav split"
```

---

### Task 2: Create category management page

**Files:**
- Create: `frontend/src/erp/categories/CategoryManagementPage.tsx`
- Modify: `frontend/src/erp/products/ProductManagementPage.tsx`

- [ ] **Step 1: Create category-only page implementation**

Create `frontend/src/erp/categories/CategoryManagementPage.tsx`:

```tsx
import { useState } from 'react'

import { CategoryDrawer } from '@/erp/categories/CategoryDrawer'
import { CategoryTable } from '@/erp/tables/CategoryTable'
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  type CatalogCategory,
  type CategoryFormValues,
} from '@/lib/erp-api'

export function CategoryManagementPage() {
  const { data: categories = [] } = useCategoriesQuery()
  const createCategoryMutation = useCreateCategoryMutation()
  const updateCategoryMutation = useUpdateCategoryMutation()
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null)

  const openCreateCategory = () => {
    setSelectedCategory(null)
    setCategoryDrawerOpen(true)
  }

  const openEditCategory = (category: CatalogCategory) => {
    setSelectedCategory(category)
    setCategoryDrawerOpen(true)
  }

  const saveCategory = async (values: CategoryFormValues) => {
    if (selectedCategory) {
      await updateCategoryMutation.mutateAsync({ id: selectedCategory.id, values })
    } else {
      await createCategoryMutation.mutateAsync(values)
    }

    setSelectedCategory(null)
    setCategoryDrawerOpen(false)
  }

  return (
    <div className="space-y-6">
      <CategoryTable
        categories={categories}
        onCreateCategory={openCreateCategory}
        onEditCategory={openEditCategory}
      />

      <CategoryDrawer
        open={categoryDrawerOpen}
        category={selectedCategory}
        categories={categories}
        onOpenChange={(open) => {
          setCategoryDrawerOpen(open)
          if (!open) {
            setSelectedCategory(null)
          }
        }}
        onSave={saveCategory}
      />
    </div>
  )
}
```

- [ ] **Step 2: Remove category orchestration from product page**

In `frontend/src/erp/products/ProductManagementPage.tsx`, remove these imports:

```tsx
import { CategoryTable } from '@/erp/tables/CategoryTable'
import { CategoryDrawer } from '@/erp/categories/CategoryDrawer'
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  type CatalogCategory,
  type CategoryFormValues,
} from '@/lib/erp-api'
```

Keep the existing product/category query and product types, so the import from `@/lib/erp-api` still includes:

```tsx
  useCategoriesQuery,
  useProductsQuery,
  type CatalogProductRecord,
  type ProductFormValues,
  type VariantFormValues,
```

Remove category drawer state and category mutation setup:

```tsx
const createCategoryMutation = useCreateCategoryMutation()
const updateCategoryMutation = useUpdateCategoryMutation()
const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null)
```

Remove these handlers:

```tsx
const openCreateCategory = () => {
  setSelectedCategory(null)
  setCategoryDrawerOpen(true)
}

const openEditCategory = (category: CatalogCategory) => {
  setSelectedCategory(category)
  setCategoryDrawerOpen(true)
}

const saveCategory = async (values: CategoryFormValues) => {
  if (selectedCategory) {
    await updateCategoryMutation.mutateAsync({ id: selectedCategory.id, values })
  } else {
    await createCategoryMutation.mutateAsync(values)
  }

  setSelectedCategory(null)
  setCategoryDrawerOpen(false)
}
```

Remove `CategoryTable` from the returned JSX:

```tsx
<CategoryTable
  categories={categories}
  onCreateCategory={openCreateCategory}
  onEditCategory={openEditCategory}
/>
```

Remove `CategoryDrawer` from the returned JSX:

```tsx
<CategoryDrawer
  open={categoryDrawerOpen}
  category={selectedCategory}
  categories={categories}
  onOpenChange={(open) => {
    setCategoryDrawerOpen(open)
    if (!open) {
      setSelectedCategory(null)
    }
  }}
  onSave={saveCategory}
/>
```

After this task, `ProductManagementPage` should still render `ProductTable`, `ProductDrawer`, and `BarcodeBatchPrintDialog`.

- [ ] **Step 3: Run management tests**

Run:

```bash
cd frontend && npm run test -- --run src/erp/__tests__/erp-management.test.tsx
```

Expected: page split tests should pass if imports resolve; route/nav tests still fail until Task 3.

- [ ] **Step 4: Commit category page split**

```bash
git add frontend/src/erp/categories/CategoryManagementPage.tsx frontend/src/erp/products/ProductManagementPage.tsx frontend/src/erp/__tests__/erp-management.test.tsx
git commit -m "split category management page"
```

---

### Task 3: Wire categories route and left navigation

**Files:**
- Create: `frontend/src/routes/erp.categories.tsx`
- Modify: `frontend/src/routeTree.gen.ts`
- Modify: `frontend/src/erp/navigation/ErpNav.tsx`

- [ ] **Step 1: Add categories route file**

Create `frontend/src/routes/erp.categories.tsx`:

```tsx
import { createRoute } from '@tanstack/react-router'

import { CategoryManagementPage } from '@/erp/categories/CategoryManagementPage'

import { Route as erpRoute } from './erp'

export const Route = createRoute({
  getParentRoute: () => erpRoute,
  path: 'categories',
  component: CategoryManagementPage,
})
```

- [ ] **Step 2: Register route in generated route tree**

Modify `frontend/src/routeTree.gen.ts` to import the new route:

```tsx
import { Route as erpCategoriesRoute } from './routes/erp.categories'
```

Update the ERP children array:

```tsx
erpRoute.addChildren([erpIndexRoute, erpInventoryRoute, erpProductsRoute, erpCategoriesRoute, erpReportsRoute]),
```

Keep the rest of the file unchanged.

- [ ] **Step 3: Add Categories to ERP left nav**

Modify `frontend/src/erp/navigation/ErpNav.tsx` imports to include `FolderTree`:

```tsx
import { BarChart3, Boxes, FolderTree, LayoutDashboard, Settings2, ShoppingCart, Table2 } from 'lucide-react'
```

Add Categories between Products and Inventory:

```tsx
{ label: 'Dashboard', icon: LayoutDashboard, to: '/erp' },
{ label: 'Products', icon: Boxes, to: '/erp/products' },
{ label: 'Categories', icon: FolderTree, to: '/erp/categories' },
{ label: 'Inventory', icon: Table2, to: '/erp/inventory' },
```

Update active matching so nested ERP paths still highlight the parent item if future child routes are added:

```tsx
const isActive = item.to === '/erp' ? pathname === '/erp' : Boolean(item.to && (pathname === item.to || pathname.startsWith(`${item.to}/`)))
```

- [ ] **Step 4: Run shell tests**

Run:

```bash
cd frontend && npm run test -- --run src/erp/__tests__/erp-shell.test.tsx
```

Expected: PASS. The new Categories nav item and route assertion should pass.

- [ ] **Step 5: Commit routing and nav**

```bash
git add frontend/src/routes/erp.categories.tsx frontend/src/routeTree.gen.ts frontend/src/erp/navigation/ErpNav.tsx frontend/src/erp/__tests__/erp-shell.test.tsx
git commit -m "add ERP categories route"
```

---

### Task 4: Final validation and review

**Files:**
- Verify all files changed by Tasks 1-3.

- [ ] **Step 1: Run focused tests**

Run:

```bash
cd frontend && npm run test -- --run src/erp/__tests__/erp-shell.test.tsx src/erp/__tests__/erp-management.test.tsx
```

Expected: PASS. Both test files pass.

- [ ] **Step 2: Run frontend build**

Run:

```bash
cd frontend && npm run build
```

Expected: PASS. Existing Vite large chunk or `html5-qrcode` dynamic import warnings are acceptable if unchanged.

- [ ] **Step 3: Inspect working tree**

Run:

```bash
git status --short --branch
```

Expected: clean working tree after task commits, branch ahead of remote.

- [ ] **Step 4: Request code review**

Ask an `oracle` reviewer to review the changes since the design-plan commit, with these requirements:

```text
Review product/category nav split. Requirements:
- /erp/products renders product management only
- /erp/categories renders category management only
- left nav includes Products and Categories separately
- product create/edit still receives categories for assignment
- barcode/QR batch printing remains product-only
- focused tests and frontend build pass
Return APPROVED or blockers/important issues only.
```

- [ ] **Step 5: Fix review blockers if any**

If the reviewer returns blockers or important issues, fix them with targeted changes, rerun:

```bash
cd frontend && npm run test -- --run src/erp/__tests__/erp-shell.test.tsx src/erp/__tests__/erp-management.test.tsx && npm run build
```

Then request review again.

- [ ] **Step 6: Commit final fixes only if needed**

If Step 5 changed files, commit them:

```bash
git add frontend/src/erp frontend/src/routes frontend/src/routeTree.gen.ts
git commit -m "fix ERP category nav split"
```

If Step 5 changed nothing, do not create an empty commit.

# T03: 02-pos-frontend-offline 02

**Slice:** S02 — **Milestone:** M001

## Description

Wire the frontend to the Encore backend API: auth context, TanStack Query data fetching, and the catalog browsing UI (category tabs + product grid + search).

Purpose: Cashiers need to see and find products to sell. This plan connects the frontend to real backend data and builds the primary catalog interface (POS-03: category browsing, POS-04: search by name/SKU).

Output: A functional POS screen showing products by category with search capability, authenticated via JWT.

## Must-Haves

- [ ] "Cashier can browse products organized by category tabs"
- [ ] "Cashier can search products by name or SKU and see results"
- [ ] "Product tiles show variant name, price in THB, and category grouping"
- [ ] "API calls use JWT Bearer token from auth context"

## Files

- `frontend/src/lib/api-client.ts`
- `frontend/src/lib/auth.tsx`
- `frontend/src/lib/query-client.ts`
- `frontend/src/hooks/use-catalog.ts`
- `frontend/src/routes/pos/index.tsx`
- `frontend/src/components/pos/category-tabs.tsx`
- `frontend/src/components/pos/product-grid.tsx`
- `frontend/src/components/pos/search-bar.tsx`
- `frontend/src/main.tsx`

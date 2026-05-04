import { createRoute } from '@tanstack/react-router'

import { ProductManagementPage } from '@/erp/products/ProductManagementPage'

import { Route as erpRoute } from './erp'

export const Route = createRoute({
  getParentRoute: () => erpRoute,
  path: 'products',
  component: ProductManagementPage,
})

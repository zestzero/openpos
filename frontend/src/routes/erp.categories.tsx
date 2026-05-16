import { createRoute } from '@tanstack/react-router'

import { CategoryManagementPage } from '@/erp/categories/CategoryManagementPage'

import { Route as erpRoute } from './erp'

export const Route = createRoute({
  getParentRoute: () => erpRoute,
  path: 'categories',
  component: CategoryManagementPage,
})

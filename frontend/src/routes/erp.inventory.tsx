import { createRoute } from '@tanstack/react-router'

import { InventoryPage } from '@/erp/inventory/InventoryPage'

import { Route as erpRoute } from './erp'

export const Route = createRoute({
  getParentRoute: () => erpRoute,
  path: 'inventory',
  component: InventoryPage,
})

import { createRoute } from '@tanstack/react-router'

import { UserManagementPage } from '@/erp/settings/users/UserManagementPage'

import { Route as settingsRoute } from './erp.settings'

export const Route = createRoute({
  getParentRoute: () => settingsRoute,
  path: 'users',
  component: UserManagementPage,
})

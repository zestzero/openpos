import { Outlet, createRoute } from '@tanstack/react-router'

import { SettingsLayout } from '@/erp/settings/SettingsLayout'

import { Route as erpRoute } from './erp'

export const Route = createRoute({
  getParentRoute: () => erpRoute,
  path: 'settings',
  component: SettingsRoute,
})

function SettingsRoute() {
  return (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  )
}

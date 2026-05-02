import { createRoute } from '@tanstack/react-router'

import { ReportDashboard } from '@/erp/reports/ReportDashboard'

import { Route as erpRoute } from './erp'

export const Route = createRoute({
  getParentRoute: () => erpRoute,
  path: 'reports',
  component: ErpReportsRoute,
})

function ErpReportsRoute() {
  return <ReportDashboard />
}

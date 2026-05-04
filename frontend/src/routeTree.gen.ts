import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as loginRoute } from './routes/login'
import { Route as posRoute } from './routes/pos'
import { Route as posCatalogRoute } from './routes/pos.catalog'
import { Route as posScanRoute } from './routes/pos.scan'
import { Route as erpRoute } from './routes/erp'
import { Route as erpIndexRoute } from './routes/erp.index'
import { Route as erpProductsRoute } from './routes/erp.products'
import { Route as erpReportsRoute } from './routes/erp.reports'

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  posRoute.addChildren([posCatalogRoute, posScanRoute]),
  erpRoute.addChildren([erpIndexRoute, erpProductsRoute, erpReportsRoute]),
])

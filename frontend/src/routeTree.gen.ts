import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as loginRoute } from './routes/login'
import { Route as posRoute } from './routes/pos'
import { Route as posInventoryRoute } from './routes/pos.inventory'
import { Route as erpRoute } from './routes/erp'
import { Route as erpIndexRoute } from './routes/erp.index'
import { Route as erpCategoriesRoute } from './routes/erp.categories'
import { Route as erpInventoryRoute } from './routes/erp.inventory'
import { Route as erpProductsRoute } from './routes/erp.products'
import { Route as erpReportsRoute } from './routes/erp.reports'

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  posRoute.addChildren([posInventoryRoute]),
  erpRoute.addChildren([erpIndexRoute, erpInventoryRoute, erpProductsRoute, erpCategoriesRoute, erpReportsRoute]),
])

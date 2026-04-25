import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as loginRoute } from './routes/login'
import { Route as posRoute } from './routes/pos'
import { Route as erpRoute } from './routes/erp'

export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  posRoute,
  erpRoute,
])

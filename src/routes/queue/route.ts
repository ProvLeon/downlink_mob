import { Route as RootRoute } from '../__root.js'

export const Route = RootRoute.createRoute({
  getParentRoute: () => RootRoute,
  path: '/queue',
})

import { createRouter } from '@tanstack/react-router'
import { Route as RootRoute } from './routes/__root.js'
import { Route as QueueRoute } from './routes/queue/index.js'
import { Route as SettingsRoute } from './routes/settings/index.js'
import { Route as CompletedRoute } from './routes/completed/index.js'

const routeTree = RootRoute.addChildren([
  QueueRoute,
  SettingsRoute,
  CompletedRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

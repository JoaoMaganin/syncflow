import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    // Um tema escuro e layout centralizado para toda a aplicação
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  ),
})
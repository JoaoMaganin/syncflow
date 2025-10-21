import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Navbar } from '@/components/Navbar'

export const Route = createRootRoute({
  component: () => (
    // Um tema escuro e layout centralizado para toda a aplicação
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <Navbar />
      <Outlet />
      <TanStackRouterDevtools />
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  ),
})
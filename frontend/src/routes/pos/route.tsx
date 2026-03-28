import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/pos')({
  component: () => (
    <div className="min-h-dvh bg-background font-body">
      <Outlet />
    </div>
  ),
})

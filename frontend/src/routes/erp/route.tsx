import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { ErrorBoundary } from '@/components/error-boundary'
import { LogoutButton } from '@/components/auth/logout-button'

export const Route = createFileRoute('/erp')({
  component: ErpLayout,
  beforeLoad: ({ context }) => {
    // Auth check happens here - the context would need to be set up properly
    // For now, we'll handle it in the component
  }
})

function ErpLayout() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    // Don't throw redirect during render - navigate declaratively
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Not Authenticated</h1>
          <p className="text-muted-foreground mt-2">
            Please log in to access the ERP backoffice.
          </p>
          <Link to="/login" className="text-blue-600 hover:underline mt-4 inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (user?.role !== 'OWNER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You need OWNER role to access the ERP backoffice.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">OpenPOS ERP</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user?.email}</span>
              <LogoutButton variant="outline" size="sm" />
            </div>
          </div>
        </header>
        <div className="bg-white border-b px-6">
          <nav className="flex gap-4">
            <Link
              to="/erp"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[active]:border-blue-600 data-[active]:text-blue-600"
            >
              Dashboard
            </Link>
            <Link
              to="/erp/inventory"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[active]:border-blue-600 data-[active]:text-blue-600"
            >
              Inventory
            </Link>
          </nav>
        </div>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </ErrorBoundary>
  )
}
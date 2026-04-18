import { createFileRoute, Outlet, Link, redirect } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { ErrorBoundary } from '@/components/error-boundary'

export const Route = createFileRoute('/erp')({
  component: ErpLayout,
})

function ErpLayout() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    throw redirect({ to: '/' })
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
          <h1 className="text-2xl font-bold text-gray-900">OpenPOS ERP</h1>
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
            <Link
              to="/erp/products"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[active]:border-blue-600 data-[active]:text-blue-600"
            >
              Products
            </Link>
            <Link
              to="/erp/reports/stock"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[active]:border-blue-600 data-[active]:text-blue-600"
            >
              Reports
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
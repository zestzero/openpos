import { createFileRoute, Outlet, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/erp')({
  component: ErpLayout,
})

function ErpLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">OpenPOS ERP</h1>
      </header>
      <div className="bg-white border-b px-6">
        <nav className="flex gap-4">
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
  )
}

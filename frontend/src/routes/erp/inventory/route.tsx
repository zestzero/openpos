import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/erp/inventory")({
  component: InventoryLayout,
});

function InventoryLayout() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Inventory Management</h2>
      <Outlet />
    </div>
  );
}
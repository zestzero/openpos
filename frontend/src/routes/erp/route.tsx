import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ErrorBoundary } from "@/components/error-boundary";

export const Route = createFileRoute("/erp")({
  component: ErpLayout,
});

function ErpLayout() {
  return (
    <ErrorBoundary>
      <div className="min-h-dvh bg-background font-body">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="text-sm font-semibold text-zinc-400">OpenPOS ERP</span>
        </div>
        <Outlet />
      </div>
    </ErrorBoundary>
  );
}

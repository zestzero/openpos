import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ErrorBoundary } from "@/components/error-boundary";
import { useAuth } from "@/lib/auth";
import { PinLogin } from "@/components/pos/pin-login";

export const Route = createFileRoute("/erp")({
  component: ErpLayout,
});

function ErpLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PinLogin />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-dvh bg-background font-body">
        <Outlet />
      </div>
    </ErrorBoundary>
  );
}
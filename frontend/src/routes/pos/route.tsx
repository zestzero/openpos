import { createFileRoute, Outlet } from "@tanstack/react-router";
import { OfflineBanner } from "@/components/pos/offline-banner";
import { SyncStatusIndicator } from "@/components/pos/sync-status-indicator";
import { PinLogin } from "@/components/pos/pin-login";
import { ErrorBoundary } from "@/components/error-boundary";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/pos")({
  component: PosLayout,
});

function PosLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PinLogin />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-dvh bg-background font-body">
        <OfflineBanner />
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-semibold text-zinc-400">OpenPOS</span>
          <SyncStatusIndicator />
        </div>
        <Outlet />
      </div>
    </ErrorBoundary>
  );
}

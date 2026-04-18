import { createFileRoute, Outlet } from "@tanstack/react-router";
import { OfflineBanner } from "@/components/pos/offline-banner";
import { SyncStatusIndicator } from "@/components/pos/sync-status-indicator";
import { PinLogin } from "@/components/pos/pin-login";
import { ErrorBoundary } from "@/components/error-boundary";
import { useAuth } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

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
          <div className="flex items-center gap-2">
            <SyncStatusIndicator />
            <LogoutButton variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-900" showIcon={true} />
          </div>
        </div>
        <Outlet />
      </div>
    </ErrorBoundary>
  );
}

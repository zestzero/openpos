import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { OfflineBanner } from "@/components/pos/offline-banner";
import { SyncStatusIndicator } from "@/components/pos/sync-status-indicator";
import { PinLogin } from "@/components/pos/pin-login";
import { ErrorBoundary } from "@/components/error-boundary";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pos")({
  component: PosLayout,
});

function PosLayout() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: '/pos' });
  };

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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-zinc-400 hover:text-zinc-900"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        <Outlet />
      </div>
    </ErrorBoundary>
  );
}

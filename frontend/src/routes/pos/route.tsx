import { createFileRoute, Outlet } from '@tanstack/react-router'
import { OfflineBanner } from '@/components/pos/offline-banner'
import { SyncStatusIndicator } from '@/components/pos/sync-status-indicator'

export const Route = createFileRoute('/pos')({
  component: () => (
    <div className="min-h-dvh bg-background font-body">
      <OfflineBanner />
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm font-semibold text-zinc-400">OpenPOS</span>
        <SyncStatusIndicator />
      </div>
      <Outlet />
    </div>
  ),
})

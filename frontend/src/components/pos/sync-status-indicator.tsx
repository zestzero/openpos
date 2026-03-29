import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getPendingSyncCount, processSyncQueue } from '@/lib/sync-queue';
import { useOnlineStatus } from '@/hooks/use-online-status';

export function SyncStatusIndicator() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const refresh = async () => {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    };
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      setIsSyncing(true);
      processSyncQueue()
        .then(async () => {
          const count = await getPendingSyncCount();
          setPendingCount(count);
        })
        .finally(() => setIsSyncing(false));
    }
  }, [isOnline, pendingCount, isSyncing]);

  if (pendingCount === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-zinc-500">
      <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
      <Badge variant="outline" className="text-xs">
        {pendingCount} pending
      </Badge>
    </div>
  );
}

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 text-sm font-medium">
      <WifiOff className="h-4 w-4" />
      <span>Offline — sales will sync when connection returns</span>
    </div>
  );
}

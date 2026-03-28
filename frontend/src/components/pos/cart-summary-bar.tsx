import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTHB } from '@/lib/format';

interface CartSummaryBarProps {
  itemCount: number;
  totalCents: number;
  onClick: () => void;
}

export function CartSummaryBar({ itemCount, totalCents, onClick }: CartSummaryBarProps) {
  if (itemCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-accent text-white safe-area-bottom"
    >
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-5 w-5" />
        <Badge variant="secondary" className="bg-white text-accent font-semibold">
          {itemCount}
        </Badge>
      </div>
      <span className="text-base font-semibold">{formatTHB(totalCents)}</span>
    </button>
  );
}
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTHB } from '@/lib/format';
import type { CartItem } from '@/stores/cart-store';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const lineTotal = item.price_cents * item.quantity;

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{item.product_name}</p>
        <p className="text-xs text-zinc-500">{item.variant_sku} · {formatTHB(item.price_cents)}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onUpdateQuantity(item.quantity - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onUpdateQuantity(item.quantity + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-sm font-semibold w-20 text-right">{formatTHB(lineTotal)}</p>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
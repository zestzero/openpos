import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CartItemRow } from './cart-item-row';
import { useCartStore } from '@/stores/cart-store';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { completeSale } from '@/lib/complete-sale';
import { formatTHB } from '@/lib/format';
import { toast } from 'sonner';

export function CartBottomSheet() {
  const { items, isSheetOpen, setSheetOpen, updateQuantity, removeItem, clearCart, getItemCount, getTotalCents } = useCartStore();
  const isOnline = useOnlineStatus();
  const [isCompleting, setIsCompleting] = useState(false);
  const itemCount = getItemCount();
  const totalCents = getTotalCents();

  const handleCompleteSale = async () => {
    if (items.length === 0) return;
    setIsCompleting(true);
    try {
      const result = await completeSale(items);
      if (result.synced) {
        toast.success('Sale complete!');
      } else {
        toast.success('Sale queued — will sync when back online');
      }
      clearCart();
      setSheetOpen(false);
    } catch (err) {
      toast.error('Failed to complete sale');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent side="bottom" className="h-[80dvh] flex flex-col rounded-t-2xl">
        <SheetHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <SheetTitle>Cart ({itemCount} items)</SheetTitle>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={clearCart}>
              Clear
            </Button>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <p className="text-lg font-medium">No items in cart</p>
            <p className="text-sm mt-1">Scan a barcode or select from catalog to begin</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-2">
              {items.map((item) => (
                <CartItemRow
                  key={item.variant_id}
                  item={item}
                  onUpdateQuantity={(qty) => updateQuantity(item.variant_id, qty)}
                  onRemove={() => removeItem(item.variant_id)}
                />
              ))}
            </div>
            <div className="border-t pt-3 space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatTHB(totalCents)}</span>
              </div>
              {!isOnline && (
                <p className="text-xs text-amber-600 text-center">Offline — sale will be queued</p>
              )}
              <Button
                className="w-full h-12 text-base font-semibold"
                size="lg"
                disabled={isCompleting}
                onClick={handleCompleteSale}
              >
                {isCompleting ? 'Processing...' : 'Complete Sale'}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CartItemRow } from './cart-item-row';
import { useCartStore } from '@/stores/cart-store';
import { formatTHB } from '@/lib/format';

export function CartBottomSheet() {
  const { items, isSheetOpen, setSheetOpen, updateQuantity, removeItem, clearCart, getItemCount, getTotalCents } = useCartStore();
  const itemCount = getItemCount();
  const totalCents = getTotalCents();

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
              <Button className="w-full h-12 text-base font-semibold" size="lg">
                Complete Sale
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
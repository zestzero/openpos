import { Star } from 'lucide-react';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useQuery } from '@tanstack/react-query';
import { fetchVariants, fetchProducts, type VariantResponse } from '@/lib/api-client';
import { formatTHB } from '@/lib/format';
import { useCartStore } from '@/stores/cart-store';

interface FavoritesBarProps {
  className?: string;
}

export function FavoritesBar({ className }: FavoritesBarProps) {
  const { variantIds } = useFavoritesStore();
  const addItem = useCartStore((s) => s.addItem);

  const { data: favoriteVariants = [] } = useQuery({
    queryKey: ['favorites', variantIds],
    queryFn: async () => {
      if (variantIds.length === 0) return [];
      const { products } = await fetchProducts();
      const allVariants: (VariantResponse & { product_name: string })[] = [];
      for (const product of products) {
        const { variants } = await fetchVariants(product.id);
        for (const v of variants) {
          if (variantIds.includes(v.id)) {
            allVariants.push({ ...v, product_name: product.name });
          }
        }
      }
      return allVariants;
    },
    enabled: variantIds.length > 0,
  });

  if (variantIds.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-none border-b bg-background ${className ?? ''}`}>
      <Star className="h-4 w-4 text-zinc-400 shrink-0" />
      {favoriteVariants.map((v) => (
        <button
          key={v.id}
          onClick={() => addItem({
            variant_id: v.id,
            product_id: v.product_id,
            product_name: v.product_name,
            variant_sku: v.sku,
            barcode: v.barcode,
            price_cents: v.price_cents,
            cost_cents: v.cost_cents,
          })}
          className="shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-full bg-surface text-sm font-medium hover:bg-zinc-200 transition-colors whitespace-nowrap"
        >
          <span>{v.product_name}</span>
          <span className="text-zinc-400">{formatTHB(v.price_cents)}</span>
        </button>
      ))}
    </div>
  );
}

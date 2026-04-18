import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchProducts, fetchVariants, fetchLowStock } from '@/lib/api-client';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories().then(r => r.categories),
  });
}

export function useProducts(categoryId?: string) {
  return useQuery({
    queryKey: ['products', { categoryId }],
    queryFn: () => fetchProducts({ category_id: categoryId }).then(r => r.products),
  });
}

export function useSearchProducts(search: string) {
  return useQuery({
    queryKey: ['products', 'search', search],
    queryFn: () => fetchProducts({ search }).then(r => r.products),
    enabled: search.length >= 2,
  });
}

export function useVariants(productId: string) {
  return useQuery({
    queryKey: ['variants', productId],
    queryFn: () => fetchVariants(productId).then(r => r.variants),
    enabled: !!productId,
  });
}

export function useLowStockVariants(threshold?: number) {
  return useQuery({
    queryKey: ['low-stock', { threshold }],
    queryFn: () => fetchLowStock(threshold).then(r => r.variants),
  });
}

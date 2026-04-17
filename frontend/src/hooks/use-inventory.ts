import { useQuery } from '@tanstack/react-query';
import { fetchInventory, ListInventoryParams } from '@/lib/api-client';

export function useInventory(params?: ListInventoryParams) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => fetchInventory(params),
  });
}
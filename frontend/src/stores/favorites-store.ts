import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  variantIds: string[];
  addFavorite: (variantId: string) => void;
  removeFavorite: (variantId: string) => void;
  isFavorite: (variantId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      variantIds: [],
      addFavorite: (variantId) => set((state) => ({
        variantIds: [...new Set([...state.variantIds, variantId])],
      })),
      removeFavorite: (variantId) => set((state) => ({
        variantIds: state.variantIds.filter(id => id !== variantId),
      })),
      isFavorite: (variantId) => get().variantIds.includes(variantId),
    }),
    { name: 'openpos-favorites' }
  )
);

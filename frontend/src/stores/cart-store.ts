import { create } from 'zustand';

export interface CartItem {
  variant_id: string;
  product_id: string;
  product_name: string;
  variant_sku: string;
  barcode: string | null;
  price_cents: number;
  cost_cents: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isSheetOpen: boolean;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setSheetOpen: (open: boolean) => void;

  // Derived (computed in selectors)
  getItemCount: () => number;
  getTotalCents: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isSheetOpen: false,

  addItem: (item) => set((state) => {
    const existing = state.items.find(i => i.variant_id === item.variant_id);
    if (existing) {
      return {
        items: state.items.map(i =>
          i.variant_id === item.variant_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      };
    }
    return { items: [...state.items, { ...item, quantity: 1 }] };
  }),

  removeItem: (variantId) => set((state) => ({
    items: state.items.filter(i => i.variant_id !== variantId),
  })),

  updateQuantity: (variantId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { items: state.items.filter(i => i.variant_id !== variantId) };
    }
    return {
      items: state.items.map(i =>
        i.variant_id === variantId ? { ...i, quantity } : i
      ),
    };
  }),

  clearCart: () => set({ items: [] }),
  setSheetOpen: (open) => set({ isSheetOpen: open }),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  getTotalCents: () => get().items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0),
}));
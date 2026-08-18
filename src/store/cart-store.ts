import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { VariantType } from "@prisma/client";

export interface CartItem {
  variantId: string;
  productId: string;
  productCode: string;
  productName: string;
  variantName: string;
  variantType: VariantType;
  multiplier: number;
  unitPrice: number;
  quantity: number;
  image: string;
  maxPurchasable: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => boolean;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalBaseUnits: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      setIsOpen: (isOpen: boolean) => set({ isOpen }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (item, quantity = 1) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => i.variantId === item.variantId);

        if (existingIndex > -1) {
          const existingItem = currentItems[existingIndex];
          const newQuantity = existingItem.quantity + quantity;

          if (item.maxPurchasable > 0 && newQuantity > item.maxPurchasable) {
            // Cap at maximum available
            const updated = [...currentItems];
            updated[existingIndex] = {
              ...existingItem,
              quantity: item.maxPurchasable,
            };
            set({ items: updated, isOpen: true });
            return false;
          }

          const updated = [...currentItems];
          updated[existingIndex] = {
            ...existingItem,
            quantity: newQuantity,
          };
          set({ items: updated, isOpen: true });
          return true;
        } else {
          const cappedQty = item.maxPurchasable > 0 ? Math.min(quantity, item.maxPurchasable) : quantity;
          set({
            items: [...currentItems, { ...item, quantity: cappedQty }],
            isOpen: true,
          });
          return true;
        }
      },

      updateQuantity: (variantId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.variantId === variantId) {
              const max = item.maxPurchasable > 0 ? item.maxPurchasable : 999;
              return {
                ...item,
                quantity: Math.min(quantity, max),
              };
            }
            return item;
          }),
        }));
      },

      removeItem: (variantId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
      },

      getTotalBaseUnits: () => {
        return get().items.reduce((total, item) => total + item.multiplier * item.quantity, 0);
      },
    }),
    {
      name: "supapburut-cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

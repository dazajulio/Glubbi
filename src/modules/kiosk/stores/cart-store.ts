// ============================================================================
// ZUSTAND STORE — Carrito de Pedidos
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartState, Product, ModifierSnapshot } from '@/types/database';
import { generateCartItemId } from '@/lib/utils';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      tableId: null,

      setContext: (restaurantId: string, tableId: string) => {
        const current = get();
        // Solo establecer el contexto si el carrito está vacío o no tiene restaurante asignado
        if (!current.restaurantId || current.items.length === 0) {
          set({ restaurantId, tableId });
        }
        // Si ya tiene un restaurante distinto y artículos, NO lo sobreescribimos aquí.
        // La validación se hará al intentar agregar un nuevo producto.
      },

      addItem: (item: Omit<CartItem, 'id' | 'subtotal'>, newRestaurantId?: string, newTableId?: string) => {
        const id = generateCartItemId();
        const subtotal = item.unitPrice * item.quantity;
        // Strip heavy fields (images, modifier metadata) to prevent localStorage quota overflow
        const lightProduct: Product = {
          ...item.product,
          image_url: item.product.image_url ? item.product.image_url.substring(0, 200) : null,
          modifier_groups: undefined as any,
        };
        const lightItem: CartItem = {
          ...item,
          id,
          subtotal,
          product: lightProduct,
        };
        set((state) => ({
          items: [...state.items, lightItem],
          ...(newRestaurantId ? { restaurantId: newRestaurantId } : {}),
          ...(newTableId ? { tableId: newTableId } : {})
        }));
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id: string, quantity: number) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, quantity, subtotal: item.unitPrice * quantity }
              : item
          ),
        }));
      },

      updateItemModifiers: (id: string, selectedModifiers: ModifierSnapshot[], unitPrice: number) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { 
                  ...item, 
                  selectedModifiers, 
                  unitPrice, 
                  subtotal: unitPrice * item.quantity 
                }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce((total, item) => total + item.subtotal, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'foodtech-cart',
      // Solo persistir items, restaurantId, tableId
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
        tableId: state.tableId,
      }),
    }
  )
);

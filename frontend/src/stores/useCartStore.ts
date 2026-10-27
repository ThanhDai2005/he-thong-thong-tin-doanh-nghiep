import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cartService } from "@/services/cartService";
import type { CartState } from "@/types/store";

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: null,
      loading: false,

      getCart: async () => {
        try {
          set({ loading: true });
          const response = await cartService.getCart();
          set({ cart: response.cart, loading: false });
        } catch (error) {
          console.error("Error fetching cart:", error);
          set({ loading: false });
          throw error;
        }
      },

      addToCart: async (productId, quantity) => {
        try {
          set({ loading: true });
          const response = await cartService.addToCart(productId, quantity);
          set({ cart: response.cart, loading: false });
        } catch (error) {
          console.error("Error adding to cart:", error);
          set({ loading: false });
          throw error;
        }
      },

      updateQuantity: async (productId, quantity) => {
        try {
          set({ loading: true });
          const response = await cartService.updateQuantity(
            productId,
            quantity,
          );
          set({ cart: response.cart, loading: false });
        } catch (error) {
          console.error("Error updating quantity:", error);
          set({ loading: false });
          throw error;
        }
      },

      removeFromCart: async (productId) => {
        try {
          set({ loading: true });
          const response = await cartService.removeFromCart(productId);
          set({ cart: response.cart, loading: false });
        } catch (error) {
          console.error("Error removing from cart:", error);
          set({ loading: false });
          throw error;
        }
      },

      clearCart: () => {
        set({ cart: null });
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ cart: state.cart }),
    },
  ),
);

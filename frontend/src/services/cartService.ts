import api from "@/lib/axios";

export const cartService = {
  getCart: async () => {
    const response = await api.get("/cart");
    return response.data;
  },

  addToCart: async (productId: string, quantity: number) => {
    const response = await api.post("/cart/add", { productId, quantity });
    return response.data;
  },

  updateQuantity: async (productId: string, quantity: number) => {
    const response = await api.patch(`/cart/update/${productId}`, { quantity });
    return response.data;
  },

  removeFromCart: async (productId: string) => {
    const response = await api.patch(`/cart/remove/${productId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.post("/cart/clear");
    return response.data;
  },
};

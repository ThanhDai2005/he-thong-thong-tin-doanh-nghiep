import { create } from "zustand";
import { orderService } from "@/services/orderService";
import type { OrderState } from "@/types/store";

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  orderReviews: null,
  loading: false,
  totalPages: 1,

  createOrder: async (data) => {
    try {
      set({ loading: true });
      const response = await orderService.create(data);
      set({ loading: false, currentOrder: response.data });
      // Return full response including paymentUrl if exists
      return {
        ...response.data,
        paymentUrl: response.paymentUrl,
      };
    } catch (error) {
      console.error("Error creating order:", error);
      set({ loading: false });
      throw error;
    }
  },

  getMyOrders: async (page = 1, limit = 10, orderStatus) => {
    try {
      set({ loading: true });
      const response = await orderService.getMyOrders(page, limit, orderStatus);
      set({
        orders: response.data,
        totalPages: response.totalPages || 1,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      set({ loading: false });
    }
  },

  getOrderDetail: async (orderId) => {
    try {
      set({ loading: true });
      const response = await orderService.getDetail(orderId);
      set({ currentOrder: response.data, loading: false });
    } catch (error) {
      console.error("Error fetching order detail:", error);
      set({ loading: false });
    }
  },

  getOrderReviews: async (orderId) => {
    try {
      set({ loading: true });
      const response = await orderService.getOrderReviews(orderId);
      set({
        orderReviews: {
          order: response.data.order,
          reviews: response.data.reviews,
        },
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching order reviews:", error);
      set({ loading: false });
      throw error;
    }
  },

  retryPayment: async (orderId) => {
    try {
      const response = await orderService.retryPayment(orderId);
      return response;
    } catch (error) {
      console.error("Error retrying payment:", error);
      throw error;
    }
  },

  cancelOrder: async (orderId) => {
    try {
      set({ loading: true });
      const response = await orderService.cancelOrder(orderId);
      set({ loading: false });
      return response;
    } catch (error) {
      console.error("Error cancelling order:", error);
      set({ loading: false });
      throw error;
    }
  },

  clearCurrentOrder: () => {
    set({ currentOrder: null });
  },
}));

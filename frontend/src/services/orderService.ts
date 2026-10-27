import api from "@/lib/axios";
import type { CreateOrderData } from "@/types/order";

export const orderService = {
  create: async (data: CreateOrderData) => {
    const response = await api.post("/order", data);
    return response.data;
  },

  getMyOrders: async (page = 1, limit = 10, orderStatus?: string) => {
    let url = `/order/my?page=${page}&limit=${limit}`;
    if (orderStatus) {
      url += `&orderStatus=${orderStatus}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  getDetail: async (orderId: string) => {
    const response = await api.get(`/order/detail/${orderId}`);
    return response.data;
  },

  getOrderReviews: async (orderId: string) => {
    const response = await api.get(`/order/${orderId}/reviews`);
    return response.data;
  },

  retryPayment: async (orderId: string) => {
    const response = await api.post(`/order/${orderId}/retry-payment`);
    return response.data;
  },

  cancelOrder: async (orderId: string) => {
    const response = await api.patch(`/order/cancel/${orderId}`);
    return response.data;
  },
};

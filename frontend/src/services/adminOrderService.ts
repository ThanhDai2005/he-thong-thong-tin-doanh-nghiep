import api from "@/lib/adminAxios";

export const adminOrderService = {
  list: async (
    page = 1,
    limit = 10,
    filters: {
      orderStatus?: string;
      paymentStatus?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(filters.orderStatus && { orderStatus: filters.orderStatus }),
      ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
      ...(filters.search && { search: filters.search }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
    });
    const response = await api.get(`/admin/order?${params}`);
    return response.data;
  },

  getDetail: async (orderId: string) => {
    const response = await api.get(`/admin/order/detail/${orderId}`);
    return response.data;
  },

  updateStatus: async (
    orderId: string,
    data: {
      orderStatus?: string;
      paymentStatus?: string;
    },
  ) => {
    const response = await api.patch(
      `/admin/order/update/${orderId}`,
      data,
    );
    return response.data;
  },
};

import adminApi from "@/lib/adminAxios";

export const adminOrderPromotionService = {
  list: async (
    keyword: string = "",
    status: string = "",
    page: number = 1,
    limit: number = 10,
  ) => {
    const response = await adminApi.get(
      `/admin/order-promotions?keyword=${keyword}&status=${status}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (orderPromotionId: string) => {
    const response = await adminApi.get(
      `/admin/order-promotions/${orderPromotionId}`,
    );
    return response.data;
  },

  create: async (data: {
    title: string;
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount?: number | null;
    usageLimit?: number | null;
    startDate: string;
    endDate: string;
    status?: "active" | "inactive";
  }) => {
    const response = await adminApi.post("/admin/order-promotions", data);
    return response.data;
  },

  update: async (
    orderPromotionId: string,
    data: {
      title?: string;
      code?: string;
      discountType?: "percentage" | "fixed";
      discountValue?: number;
      minOrderValue?: number;
      maxDiscountAmount?: number | null;
      usageLimit?: number | null;
      startDate?: string;
      endDate?: string;
      status?: "active" | "inactive";
    },
  ) => {
    const response = await adminApi.patch(
      `/admin/order-promotions/update/${orderPromotionId}`,
      data,
    );
    return response.data;
  },

  changeStatus: async (orderPromotionId: string, status: string) => {
    const response = await adminApi.patch(
      `/admin/order-promotions/change-status/${orderPromotionId}`,
      { status },
    );
    return response.data;
  },

  changeMulti: async (ids: string[], type: string) => {
    const response = await adminApi.patch(
      "/admin/order-promotions/change-multi",
      {
        ids,
        type,
      },
    );
    return response.data;
  },

  deleteItem: async (orderPromotionId: string) => {
    const response = await adminApi.patch(
      `/admin/order-promotions/delete/${orderPromotionId}`,
    );
    return response.data;
  },
};

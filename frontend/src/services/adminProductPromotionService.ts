import adminApi from "@/lib/adminAxios";

export const adminProductPromotionService = {
  list: async (
    keyword: string = "",
    status: string = "",
    page: number = 1,
    limit: number = 10,
  ) => {
    const response = await adminApi.get(
      `/admin/product-promotions?keyword=${keyword}&status=${status}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (productPromotionId: string) => {
    const response = await adminApi.get(
      `/admin/product-promotions/${productPromotionId}`,
    );
    return response.data;
  },

  create: async (data: {
    title: string;
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    maxDiscountAmount?: number | null;
    usageLimit?: number | null;
    startDate: string;
    endDate: string;
    status?: "active" | "inactive";
    productIds: string[];
  }) => {
    const response = await adminApi.post("/admin/product-promotions", data);
    return response.data;
  },

  update: async (
    productPromotionId: string,
    data: {
      title?: string;
      code?: string;
      discountType?: "percentage" | "fixed";
      discountValue?: number;
      maxDiscountAmount?: number | null;
      usageLimit?: number | null;
      startDate?: string;
      endDate?: string;
      status?: "active" | "inactive";
      productIds?: string[];
    },
  ) => {
    const response = await adminApi.patch(
      `/admin/product-promotions/update/${productPromotionId}`,
      data,
    );
    return response.data;
  },

  changeStatus: async (productPromotionId: string, status: string) => {
    const response = await adminApi.patch(
      `/admin/product-promotions/change-status/${productPromotionId}`,
      { status },
    );
    return response.data;
  },

  changeMulti: async (ids: string[], type: string) => {
    const response = await adminApi.patch("/admin/product-promotions/change-multi", {
      ids,
      type,
    });
    return response.data;
  },

  deleteItem: async (productPromotionId: string) => {
    const response = await adminApi.patch(
      `/admin/product-promotions/delete/${productPromotionId}`,
    );
    return response.data;
  },
};

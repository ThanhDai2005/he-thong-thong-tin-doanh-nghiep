import adminApi from "@/lib/adminAxios";

export const adminCustomerVoucherService = {
  list: async (
    keyword: string = "",
    status: string = "",
    page: number = 1,
    limit: number = 10,
  ) => {
    const response = await adminApi.get(
      `/admin/customer-vouchers?keyword=${keyword}&status=${status}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (promotionId: string) => {
    const response = await adminApi.get(
      `/admin/customer-vouchers/${promotionId}`,
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
    customerIds: string[];
  }) => {
    const response = await adminApi.post("/admin/customer-vouchers", data);
    return response.data;
  },

  issueVoucher: async (promotionId: string, customerIds: string[]) => {
    const response = await adminApi.post(
      `/admin/customer-vouchers/issue/${promotionId}`,
      { customerIds },
    );
    return response.data;
  },
};

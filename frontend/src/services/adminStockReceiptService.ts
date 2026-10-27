import adminApi from "@/lib/adminAxios";

export const adminStockReceiptService = {
  getList: async (
    keyword = "",
    status = "",
    supplierId = "",
    startDate = "",
    endDate = "",
    page = 1,
    limit = 10,
  ) => {
    const params = new URLSearchParams();
    if (keyword) params.append("keyword", keyword);
    if (status) params.append("status", status);
    if (supplierId) params.append("supplierId", supplierId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("page", String(page));
    params.append("limit", String(limit));
    const response = await adminApi.get(`/admin/stock-receipt?${params}`);
    return response.data;
  },

  getDetail: async (receiptId: string) => {
    const response = await adminApi.get(`/admin/stock-receipt/${receiptId}`);
    return response.data;
  },

  create: async (data: {
    supplierId: string;
    items: { productId: string; quantity: number; importPrice: number }[];
  }) => {
    const response = await adminApi.post("/admin/stock-receipt", data);
    return response.data;
  },

  confirm: async (receiptId: string) => {
    const response = await adminApi.patch(
      `/admin/stock-receipt/confirm/${receiptId}`,
    );
    return response.data;
  },

  cancel: async (receiptId: string) => {
    const response = await adminApi.patch(
      `/admin/stock-receipt/cancel/${receiptId}`,
    );
    return response.data;
  },
};

import adminApi from "@/lib/adminAxios";

export const adminDashboardService = {
  getStats: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate && endDate) {
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    }
    const url = `/admin/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await adminApi.get(url);
    return response.data;
  },

  getOrderStatusByMonth: async (month?: string) => {
    const params = new URLSearchParams();
    if (month && month !== "all") {
      params.append("month", month);
    }
    const url = `/admin/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await adminApi.get(url);
    return response.data;
  },
};

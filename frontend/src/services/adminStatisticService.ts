import api from "@/lib/adminAxios";

export const adminStatisticService = {
  getStats: async (
    startDate?: string,
    endDate?: string,
    month?: string,
    customerYear?: number,
  ) => {
    const params = new URLSearchParams();

    if (startDate && endDate) {
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    }

    if (month !== undefined) {
      params.append("month", month);
    }

    if (customerYear) {
      params.append("customerYear", customerYear.toString());
    }

    const url = `/admin/statistic${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  },

  getCustomerReport: async () => {
    const response = await api.get("/admin/statistic/customer-report");
    return response.data;
  },
};

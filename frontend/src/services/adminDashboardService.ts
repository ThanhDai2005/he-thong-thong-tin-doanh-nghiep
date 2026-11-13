import api from "@/lib/adminAxios";

export const adminDashboardService = {
  getStats: async (
    startDate?: string,
    endDate?: string,
    month?: string,
  ) => {
    const params = new URLSearchParams();

    if (startDate && endDate) {
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    }

    if (month !== undefined) {
      params.append("month", month);
    }

    const url = `/admin/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  },
};

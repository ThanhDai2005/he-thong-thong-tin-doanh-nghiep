import { create } from "zustand";
import type { AdminStatisticState } from "@/types/store";
import { adminStatisticService } from "@/services/adminStatisticService";

export const useAdminStatisticStore = create<AdminStatisticState>((set) => ({
  stats: {
    revenueByMonth: [],
    revenueByQuarter: [],
    revenueByYear: [],
    revenueByStaff: [],
    revenueByProductQuarter: [],
    revenueByCustomerYear: [],
    revenueByCustomerQuarter: [],
  },
  customerReport: null,
  loading: false,

  fetchStats: async (startDate, endDate, month, customerYear) => {
    try {
      set({ loading: true });
      const response = await adminStatisticService.getStats(
        startDate,
        endDate,
        month,
        customerYear
      );

      set((state) => ({
        stats: {
          ...state.stats,
          ...response.data,
        },
        loading: false,
      }));
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
      set({ loading: false });
      throw error;
    }
  },

  fetchCustomerReport: async () => {
    try {
      set({ loading: true });
      const response = await adminStatisticService.getCustomerReport();
      set({ customerReport: response.data, loading: false });
    } catch (error) {
      console.error("Lỗi khi tải báo cáo khách hàng:", error);
      set({ loading: false });
      throw error;
    }
  },
}));

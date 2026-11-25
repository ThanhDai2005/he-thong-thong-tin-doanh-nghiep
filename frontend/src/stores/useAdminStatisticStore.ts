import { create } from "zustand";
import type { AdminStatisticState } from "@/types/store";
import { adminStatisticService } from "@/services/adminStatisticService";
import { toast } from "sonner";

let productRequestId = 0;

export const useAdminStatisticStore = create<AdminStatisticState>((set) => ({
  productStats: null,
  productsLoading: false,

  fetchProductStats: async (mode, year) => {
    const requestId = ++productRequestId;
    try {
      set({ productsLoading: true });
      const response = await adminStatisticService.getProductStats(mode, year);
      if (requestId !== productRequestId) return;
      set({ productStats: response.data, productsLoading: false });
    } catch (error) {
      if (requestId !== productRequestId) return;
      console.error("Lỗi khi tải thống kê sản phẩm:", error);
      toast.error("Không thể tải thống kê sản phẩm");
      set({ productStats: null, productsLoading: false });
    }
  },

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
        customerYear,
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

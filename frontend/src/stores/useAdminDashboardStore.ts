import { create } from "zustand";
import type { AdminDashboardState } from "@/types/store";
import { adminDashboardService } from "@/services/adminDashboardService";

export const useAdminDashboardStore = create<AdminDashboardState>((set) => ({
  stats: {
    overview: {
      totalCustomers: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalCategories: 0,
    },
    orderStatus: {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
    revenueByDateRange: {
      totalRevenue: 0,
      totalOrders: 0,
    },
    monthlyRevenue: [],
    recentOrders: [],
    topProducts: [],
  },
  loading: false,

  fetchStats: async (startDate, endDate) => {
    try {
      set({ loading: true });
      const response = await adminDashboardService.getStats(startDate, endDate);
      set({ stats: response.data, loading: false });
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
      set({ loading: false });
      throw error;
    }
  },

  fetchOrderStatusByMonth: async (month) => {
    try {
      const response = await adminDashboardService.getOrderStatusByMonth(month);
      set((state) => ({
        stats: {
          ...state.stats,
          orderStatus: response.data.orderStatus,
        },
      }));
    } catch (error) {
      console.error("Lỗi khi tải thống kê đơn hàng theo tháng:", error);
      throw error;
    }
  },
}));

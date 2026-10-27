import { create } from "zustand";
import type { AdminOrderStore } from "@/types/store";
import { adminOrderService } from "@/services/adminOrderService";
import { toast } from "sonner";

export const useAdminOrderStore = create<AdminOrderStore>((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  totalPages: 1,
  totalItems: 0,

  fetchOrders: async (page = 1, limit = 10, filters = {}) => {
    try {
      set({ loading: true });
      const response = await adminOrderService.list(page, limit, filters);
      set({
        orders: response.data,
        totalPages: response.totalPages || 1,
        totalItems: response.totalItems || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn hàng:", error);
      set({ loading: false });
      toast.error("Lỗi khi tải danh sách đơn hàng");
    }
  },

  fetchOrderDetail: async (orderId) => {
    try {
      set({ loading: true });
      const response = await adminOrderService.getDetail(orderId);
      set({ currentOrder: response.data, loading: false });
    } catch (error) {
      console.error("Lỗi khi tải chi tiết đơn hàng:", error);
      set({ loading: false });
      toast.error("Lỗi khi tải chi tiết đơn hàng");
      throw error;
    }
  },

  updateOrderStatus: async (orderId, data) => {
    try {
      set({ loading: true });
      const response = await adminOrderService.updateStatus(orderId, data);
      set({ currentOrder: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      set({ loading: false });
      toast.error(
        error.response?.data?.message || "Lỗi khi cập nhật trạng thái",
      );
      throw error;
    }
  },

  clearCurrentOrder: () => {
    set({ currentOrder: null });
  },
}));

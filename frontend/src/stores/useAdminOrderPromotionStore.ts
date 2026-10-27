import { create } from "zustand";
import { adminOrderPromotionService } from "@/services/adminOrderPromotionService";
import { toast } from "sonner";
import type { AdminOrderPromotionStore } from "@/types/store";

export const useAdminOrderPromotionStore = create<AdminOrderPromotionStore>(
  (set) => ({
    orderPromotions: [],
    currentOrderPromotion: null,
    loading: false,
    totalPages: 1,

    fetchOrderPromotions: async (
      keyword = "",
      status = "",
      page = 1,
      limit = 10,
    ) => {
      try {
        set({ loading: true });
        const response = await adminOrderPromotionService.list(
          keyword,
          status,
          page,
          limit,
        );
        set({
          orderPromotions: response.data,
          totalPages: response.totalPages,
          loading: false,
        });
      } catch (error) {
        console.error("Lỗi khi tải danh sách khuyến mãi đơn hàng:", error);
        set({ loading: false });
        throw error;
      }
    },

    getDetail: async (orderPromotionId: string) => {
      try {
        set({ loading: true });
        const response =
          await adminOrderPromotionService.getDetail(orderPromotionId);
        set({ currentOrderPromotion: response.data, loading: false });
      } catch (error) {
        console.error("Lỗi khi tải chi tiết khuyến mãi đơn hàng:", error);
        set({ loading: false });
        toast.error("Không thể tải chi tiết khuyến mãi đơn hàng");
        throw error;
      }
    },

    create: async (data) => {
      try {
        set({ loading: true });
        await adminOrderPromotionService.create(data);
        set({ loading: false });
        toast.success("Tạo khuyến mãi đơn hàng thành công");
      } catch (error) {
        console.error("Lỗi khi tạo khuyến mãi đơn hàng:", error);
        set({ loading: false });
        toast.error("Tạo khuyến mãi đơn hàng thất bại");
        throw error;
      }
    },

    update: async (orderPromotionId: string, data: Record<string, unknown>) => {
      try {
        set({ loading: true });
        await adminOrderPromotionService.update(orderPromotionId, data);
        set({ loading: false });
        toast.success("Cập nhật khuyến mãi đơn hàng thành công");
      } catch (error) {
        console.error("Lỗi khi cập nhật khuyến mãi đơn hàng:", error);
        set({ loading: false });
        toast.error("Cập nhật khuyến mãi đơn hàng thất bại");
        throw error;
      }
    },

    changeStatus: async (
      orderPromotionId: string,
      status: "active" | "inactive",
    ) => {
      try {
        await adminOrderPromotionService.changeStatus(orderPromotionId, status);
        const message =
          status === "active"
            ? "Khôi phục khuyến mãi đơn hàng thành công"
            : "Ngưng hoạt động khuyến mãi đơn hàng thành công";
        toast.success(message);
      } catch (error) {
        console.error("Lỗi khi thay đổi trạng thái khuyến mãi đơn hàng:", error);
        toast.error("Thay đổi trạng thái thất bại");
        throw error;
      }
    },

    changeMulti: async (
      ids: string[],
      type: "active" | "inactive" | "delete-all",
    ) => {
      try {
        await adminOrderPromotionService.changeMulti(ids, type);
        const messages = {
          active: "Khôi phục các khuyến mãi đơn hàng thành công",
          inactive: "Ngưng hoạt động các khuyến mãi đơn hàng thành công",
          "delete-all": "Xóa vĩnh viễn các khuyến mãi đơn hàng thành công",
        };
        toast.success(messages[type]);
      } catch (error) {
        console.error("Lỗi khi thao tác nhiều khuyến mãi đơn hàng:", error);
        toast.error("Thao tác thất bại");
        throw error;
      }
    },

    deleteItem: async (orderPromotionId: string) => {
      try {
        await adminOrderPromotionService.deleteItem(orderPromotionId);
        toast.success("Xóa vĩnh viễn khuyến mãi đơn hàng thành công");
      } catch (error) {
        console.error("Lỗi khi xóa vĩnh viễn khuyến mãi đơn hàng:", error);
        toast.error("Xóa vĩnh viễn thất bại");
        throw error;
      }
    },
  }),
);

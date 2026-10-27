import { create } from "zustand";
import { adminProductPromotionService } from "@/services/adminProductPromotionService";
import { toast } from "sonner";
import type { AdminProductPromotionStore } from "@/types/store";

export const useAdminProductPromotionStore = create<AdminProductPromotionStore>(
  (set) => ({
    productPromotions: [],
    currentProductPromotion: null,
    loading: false,
    totalPages: 1,

    fetchProductPromotions: async (
      keyword = "",
      status = "",
      page = 1,
      limit = 10,
    ) => {
      try {
        set({ loading: true });
        const response = await adminProductPromotionService.list(
          keyword,
          status,
          page,
          limit,
        );
        set({
          productPromotions: response.data,
          totalPages: response.totalPages,
          loading: false,
        });
      } catch (error) {
        console.error("Lỗi khi tải danh sách khuyến mãi sản phẩm:", error);
        set({ loading: false });
        throw error;
      }
    },

    getDetail: async (productPromotionId: string) => {
      try {
        set({ loading: true });
        const response =
          await adminProductPromotionService.getDetail(productPromotionId);
        set({ currentProductPromotion: response.data, loading: false });
      } catch (error) {
        console.error("Lỗi khi tải chi tiết khuyến mãi sản phẩm:", error);
        set({ loading: false });
        toast.error("Không thể tải chi tiết khuyến mãi sản phẩm");
        throw error;
      }
    },

    create: async (data) => {
      try {
        set({ loading: true });
        await adminProductPromotionService.create(data);
        set({ loading: false });
        toast.success("Tạo khuyến mãi sản phẩm thành công");
      } catch (error) {
        console.error("Lỗi khi tạo khuyến mãi sản phẩm:", error);
        set({ loading: false });
        toast.error("Tạo khuyến mãi sản phẩm thất bại");
        throw error;
      }
    },

    update: async (productPromotionId: string, data: Record<string, unknown>) => {
      try {
        set({ loading: true });
        await adminProductPromotionService.update(productPromotionId, data);
        set({ loading: false });
        toast.success("Cập nhật khuyến mãi sản phẩm thành công");
      } catch (error) {
        console.error("Lỗi khi cập nhật khuyến mãi sản phẩm:", error);
        set({ loading: false });
        toast.error("Cập nhật khuyến mãi sản phẩm thất bại");
        throw error;
      }
    },

    changeStatus: async (
      productPromotionId: string,
      status: "active" | "inactive",
    ) => {
      try {
        await adminProductPromotionService.changeStatus(productPromotionId, status);
        const message =
          status === "active"
            ? "Khôi phục khuyến mãi sản phẩm thành công"
            : "Ngưng hoạt động khuyến mãi sản phẩm thành công";
        toast.success(message);
      } catch (error) {
        console.error("Lỗi khi thay đổi trạng thái khuyến mãi sản phẩm:", error);
        toast.error("Thay đổi trạng thái thất bại");
        throw error;
      }
    },

    changeMulti: async (
      ids: string[],
      type: "active" | "inactive" | "delete-all",
    ) => {
      try {
        await adminProductPromotionService.changeMulti(ids, type);
        const messages = {
          active: "Khôi phục các khuyến mãi sản phẩm thành công",
          inactive: "Ngưng hoạt động các khuyến mãi sản phẩm thành công",
          "delete-all": "Xóa vĩnh viễn các khuyến mãi sản phẩm thành công",
        };
        toast.success(messages[type]);
      } catch (error) {
        console.error("Lỗi khi thao tác nhiều khuyến mãi sản phẩm:", error);
        toast.error("Thao tác thất bại");
        throw error;
      }
    },

    deleteItem: async (productPromotionId: string) => {
      try {
        await adminProductPromotionService.deleteItem(productPromotionId);
        toast.success("Xóa vĩnh viễn khuyến mãi sản phẩm thành công");
      } catch (error) {
        console.error("Lỗi khi xóa vĩnh viễn khuyến mãi sản phẩm:", error);
        toast.error("Xóa vĩnh viễn thất bại");
        throw error;
      }
    },
  }),
);

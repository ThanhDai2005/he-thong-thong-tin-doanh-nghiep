import { create } from "zustand";
import type { AdminCategoryState } from "@/types/store";
import { adminCategoryService } from "@/services/adminCategoryService";
import { toast } from "sonner";

export const useAdminCategoryStore = create<AdminCategoryState>((set) => ({
  categories: [],
  totalPages: 1,
  loading: false,

  fetchCategories: async (keyword = "", status = "", page = 1, limit = 10) => {
    try {
      set({ loading: true });
      const response = await adminCategoryService.getList(keyword, status, page, limit);
      set({
        categories: response.data,
        totalPages: response.totalPages,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
      set({ loading: false });
    }
  },

  getCategoryDetail: async (categoryId) => {
    try {
      set({ loading: true });
      const response = await adminCategoryService.getDetail(categoryId);
      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải chi tiết danh mục:", error);
      toast.error("Không thể tải thông tin danh mục");
      set({ loading: false });
      throw error;
    }
  },

  createCategory: async (data) => {
    try {
      set({ loading: true });
      await adminCategoryService.create(data);
      toast.success("Tạo danh mục thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi tạo danh mục:", error);
      toast.error("Không thể tạo danh mục");
      set({ loading: false });
      throw error;
    }
  },

  updateCategory: async (categoryId, data) => {
    try {
      set({ loading: true });
      await adminCategoryService.update(categoryId, data);
      toast.success("Cập nhật danh mục thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi cập nhật danh mục:", error);
      toast.error("Không thể cập nhật danh mục");
      set({ loading: false });
      throw error;
    }
  },

  changeStatus: async (categoryId, status) => {
    try {
      set({ loading: true });
      await adminCategoryService.changeStatus(categoryId, status);
      const message = status === "active" ? "Khôi phục danh mục thành công" : "Ngưng hoạt động danh mục thành công";
      toast.success(message);
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái danh mục:", error);
      toast.error("Không thể thay đổi trạng thái danh mục");
      set({ loading: false });
      throw error;
    }
  },

  changeMulti: async (ids, type) => {
    try {
      set({ loading: true });
      await adminCategoryService.changeMulti(ids, type);
      const messages = {
        active: "Khôi phục các danh mục thành công",
        inactive: "Chuyển sang ngưng hoạt động thành công",
        "delete-all": "Xóa vĩnh viễn các danh mục thành công",
      };
      toast.success(messages[type]);
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi thay đổi nhiều danh mục:", error);
      toast.error("Không thể thay đổi danh mục");
      set({ loading: false });
      throw error;
    }
  },

  deleteItem: async (categoryId) => {
    try {
      set({ loading: true });
      await adminCategoryService.deleteItem(categoryId);
      toast.success("Xóa vĩnh viễn danh mục thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi xóa vĩnh viễn danh mục:", error);
      toast.error("Không thể xóa vĩnh viễn danh mục");
      set({ loading: false });
      throw error;
    }
  },
}));

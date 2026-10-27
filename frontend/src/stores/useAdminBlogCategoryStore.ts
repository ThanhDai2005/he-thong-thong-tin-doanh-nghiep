import { create } from "zustand";
import type { AdminBlogCategoryState } from "@/types/store";
import { adminBlogCategoryService } from "@/services/adminBlogCategoryService";
import { toast } from "sonner";

export const useAdminBlogCategoryStore = create<AdminBlogCategoryState>(
  (set) => ({
    blogCategories: [],
    totalPages: 1,
    loading: false,

    fetchBlogCategories: async (
      keyword = "",
      status = "",
      page = 1,
      limit = 10,
    ) => {
      try {
        set({ loading: true });
        const response = await adminBlogCategoryService.getList(
          keyword,
          status,
          page,
          limit,
        );
        set({
          blogCategories: response.data,
          totalPages: response.totalPages,
          loading: false,
        });
      } catch (error) {
        console.error("Lỗi khi tải danh mục bài viết:", error);
        set({ loading: false });
      }
    },

    getBlogCategoryDetail: async (blogCategoryId) => {
      try {
        set({ loading: true });
        const response =
          await adminBlogCategoryService.getDetail(blogCategoryId);
        set({ loading: false });
        return response.data;
      } catch (error) {
        console.error("Lỗi khi tải chi tiết danh mục:", error);
        toast.error("Không thể tải thông tin danh mục");
        set({ loading: false });
        throw error;
      }
    },

    createBlogCategory: async (data) => {
      try {
        set({ loading: true });
        await adminBlogCategoryService.create(data);
        toast.success("Tạo danh mục thành công");
        set({ loading: false });
      } catch (error) {
        console.error("Lỗi khi tạo danh mục:", error);
        toast.error("Không thể tạo danh mục");
        set({ loading: false });
        throw error;
      }
    },

    updateBlogCategory: async (blogCategoryId, data) => {
      try {
        set({ loading: true });
        await adminBlogCategoryService.update(blogCategoryId, data);
        toast.success("Cập nhật danh mục thành công");
        set({ loading: false });
      } catch (error) {
        console.error("Lỗi khi cập nhật danh mục:", error);
        toast.error("Không thể cập nhật danh mục");
        set({ loading: false });
        throw error;
      }
    },

    changeStatus: async (blogCategoryId, status) => {
      try {
        set({ loading: true });
        await adminBlogCategoryService.changeStatus(blogCategoryId, status);
        toast.success("Cập nhật trạng thái thành công");
        set({ loading: false });
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái:", error);
        toast.error("Không thể cập nhật trạng thái");
        set({ loading: false });
        throw error;
      }
    },

    changeMulti: async (ids, type) => {
      try {
        set({ loading: true });
        await adminBlogCategoryService.changeMulti(ids, type);
        const messages = {
          active: "Cập nhật trạng thái thành công",
          inactive: "Cập nhật trạng thái thành công",
          "delete-all": "Xóa các danh mục thành công",
        };
        toast.success(messages[type]);
        set({ loading: false });
      } catch (error) {
        console.error("Lỗi khi thay đổi nhiều danh mục:", error);
        toast.error("Không thể thực hiện thao tác");
        set({ loading: false });
        throw error;
      }
    },

    deleteItem: async (blogCategoryId) => {
      try {
        set({ loading: true });
        await adminBlogCategoryService.deleteItem(blogCategoryId);
        toast.success("Xóa danh mục thành công");
        set({ loading: false });
      } catch (error) {
        console.error("Lỗi khi xóa danh mục:", error);
        toast.error("Không thể xóa danh mục");
        set({ loading: false });
        throw error;
      }
    },
  }),
);

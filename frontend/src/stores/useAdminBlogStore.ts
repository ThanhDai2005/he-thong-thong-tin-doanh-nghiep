import { create } from "zustand";
import type { AdminBlogState } from "@/types/store";
import { adminBlogService } from "@/services/adminBlogService";
import { toast } from "sonner";

export const useAdminBlogStore = create<AdminBlogState>((set) => ({
  blogs: [],
  totalPages: 1,
  loading: false,

  fetchBlogs: async (
    keyword = "",
    blogCategorySlug = "",
    status = "",
    page = 1,
    limit = 10,
  ) => {
    try {
      set({ loading: true });
      const response = await adminBlogService.getList(
        keyword,
        blogCategorySlug,
        status,
        page,
        limit,
      );
      set({
        blogs: response.data,
        totalPages: response.totalPages,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
      set({ loading: false });
    }
  },

  getBlogDetail: async (blogId) => {
    try {
      set({ loading: true });
      const response = await adminBlogService.getDetail(blogId);
      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải chi tiết bài viết:", error);
      toast.error("Không thể tải thông tin bài viết");
      set({ loading: false });
      throw error;
    }
  },

  createBlog: async (data) => {
    try {
      set({ loading: true });
      await adminBlogService.create(data);
      toast.success("Tạo bài viết thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi tạo bài viết:", error);
      toast.error("Không thể tạo bài viết");
      set({ loading: false });
      throw error;
    }
  },

  updateBlog: async (blogId, data) => {
    try {
      set({ loading: true });
      await adminBlogService.update(blogId, data);
      toast.success("Cập nhật bài viết thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi cập nhật bài viết:", error);
      toast.error("Không thể cập nhật bài viết");
      set({ loading: false });
      throw error;
    }
  },

  changeStatus: async (blogId, status) => {
    try {
      set({ loading: true });
      await adminBlogService.changeStatus(blogId, status);
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
      await adminBlogService.changeMulti(ids, type);
      const messages = {
        active: "Cập nhật trạng thái thành công",
        inactive: "Cập nhật trạng thái thành công",
        "delete-all": "Xóa các bài viết thành công",
      };
      toast.success(messages[type]);
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi thay đổi nhiều bài viết:", error);
      toast.error("Không thể thực hiện thao tác");
      set({ loading: false });
      throw error;
    }
  },

  deleteItem: async (blogId) => {
    try {
      set({ loading: true });
      await adminBlogService.deleteItem(blogId);
      toast.success("Xóa bài viết thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi xóa bài viết:", error);
      toast.error("Không thể xóa bài viết");
      set({ loading: false });
      throw error;
    }
  },
}));

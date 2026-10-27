import { create } from "zustand";
import { blogService } from "@/services/blogService";
import type { BlogState } from "@/types/store";

export const useBlogStore = create<BlogState>((set) => ({
  blog: [],
  currentBlog: null,
  loading: false,

  getList: async (
    keyword = "",
    blogCategorySlug = "",
    page = 1,
    limit = 12,
  ) => {
    set({ loading: true });
    try {
      const response = await blogService.getList(
        keyword,
        blogCategorySlug,
        page,
        limit,
      );
      set({ blog: response.data || [], loading: false });

      return response.data;
    } catch (error) {
      console.error("Error fetching blog:", error);
      set({ loading: false });
    }
  },

  getDetail: async (slug) => {
    set({ loading: true, currentBlog: null });
    try {
      const response = await blogService.getDetail(slug);
      set({ currentBlog: response.data, loading: false });
    } catch (error) {
      console.error("Error fetching blog article:", error);
      set({ loading: false });
    }
  },
}));

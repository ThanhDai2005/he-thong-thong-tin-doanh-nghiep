import { create } from "zustand";
import { blogCategoryService } from "@/services/blogCategoryService";
import type { BlogCategoryState } from "@/types/store";

export const useBlogCategoryStore = create<BlogCategoryState>((set) => ({
  blogCategory: [],
  loading: false,

  fetchBlogCategories: async () => {
    try {
      set({ loading: true });
      const response = await blogCategoryService.getList();
      set({ blogCategory: response.data, loading: false });
    } catch (error) {
      console.error("Error fetching categories:", error);
      set({ loading: false });
    }
  },
}));

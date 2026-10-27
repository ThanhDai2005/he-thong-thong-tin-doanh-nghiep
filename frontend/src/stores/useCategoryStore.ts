import type { CategoryState } from "@/types/store";
import { create } from "zustand";
import { categoryService } from "@/services/categoryService";

export const useCategoryStore = create<CategoryState>((set) => ({
  category: [],
  loading: false,

  getList: async () => {
    try {
      set({ loading: true });
      const response = await categoryService.getList();
      set({ category: response.data, loading: false });
    } catch (error) {
      console.error("Error fetching categories:", error);
      set({ loading: false });
      throw error;
    }
  },
}));

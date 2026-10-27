import type { ProductState } from "@/types/store";
import { create } from "zustand";
import { productService } from "@/services/productService";

export const useProductStore = create<ProductState>((set, get) => ({
  product: [],
  currentProduct: null,
  loading: false,
  totalPages: 1,
  totalItems: 0,

  getList: async (
    keyword = "",
    categorySlug = "",
    page = 1,
    limit = 12,
    sortKey = "",
    sortValue = "",
    minPrice = "",
    maxPrice = "",
    hasPromotion = "",
  ) => {
    try {
      set({ loading: true });
      const response = await productService.getList(
        keyword,
        categorySlug,
        page,
        limit,
        sortKey,
        sortValue,
        minPrice,
        maxPrice,
        hasPromotion,
      );
      set({
        product: response.data,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
        loading: false,
      });
      return response;
    } catch (error) {
      console.error("Error fetching products:", error);
      set({ loading: false });
      throw error;
    }
  },

  getDetail: async (slug) => {
    try {
      set({ loading: true });
      const response = await productService.getDetail(slug);
      set({ currentProduct: response.data, loading: false });
      return response;
    } catch (error) {
      console.error("Error fetching product detail:", error);
      set({ loading: false, currentProduct: null });
      throw error;
    }
  },
}));

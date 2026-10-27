import { create } from "zustand";
import { reviewService } from "@/services/reviewService";
import type { ReviewState } from "@/types/store";

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  loading: false,
  currentPage: 1,
  totalPages: 1,

  createReview: async (
    productId,
    orderId,
    rating,
    comment,
    images,
  ) => {
    set({ loading: true });
    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("orderId", orderId);
      formData.append("rating", rating.toString());
      formData.append("comment", comment);

      if (images && images.length > 0) {
        images.forEach((image) => {
          formData.append("images", image);
        });
      }

      const response = await reviewService.create(formData);
      set({ loading: false });
      return response;
    } catch (error) {
      console.error("Error creating review:", error);
      set({ loading: false });
      throw error;
    }
  },

  getReviewsByProduct: async (productId, page = 1, limit = 5) => {
    set({ loading: true });
    try {
      const response = await reviewService.getList(productId, page, limit);
      set({
        reviews: response.data,
        totalPages: response.totalPages,
        currentPage: page,
        loading: false,
      });
      return response;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      set({ loading: false });
      throw error;
    }
  },

  loadMoreReviews: async (productId, limit = 5) => {
    const { currentPage, totalPages } = get();

    // Kiểm tra đã tải hết trang cuối
    if (currentPage >= totalPages) {
      return;
    }

    set({ loading: true });
    try {
      const nextPage = currentPage + 1;
      const response = await reviewService.getList(productId, nextPage, limit);

      const currentReviews = get().reviews;
      set({
        reviews: [...currentReviews, ...response.data],
        totalPages: response.totalPages,
        currentPage: nextPage,
        loading: false,
      });
      return response;
    } catch (error) {
      console.error("Error loading more reviews:", error);
      set({ loading: false });
      throw error;
    }
  },

  resetReviews: () => {
    set({ reviews: [], currentPage: 1, totalPages: 1 });
  },
}));

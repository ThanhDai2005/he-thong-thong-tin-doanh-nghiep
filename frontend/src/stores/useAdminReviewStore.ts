import { create } from "zustand";
import { toast } from "sonner";
import type { AdminReviewStore } from "@/types/store";
import { adminReviewService } from "@/services/adminReviewService";

export const useAdminReviewStore = create<AdminReviewStore>((set) => ({
  reviews: [],
  currentReview: null,
  totalPages: 1,
  totalItems: 0,
  loading: false,
  stats: null,

  fetchStats: async () => {
    try {
      const response = await adminReviewService.stats();
      set({ stats: response.data });
    } catch (error) {
      console.error("Lỗi khi tải thống kê đánh giá:", error);
    }
  },

  fetchReviews: async (
    keyword = "",
    rating = "all",
    visibility = "all",
    page = 1,
    limit = 10,
    sortKey = "",
    sortValue = "",
  ) => {
    try {
      set({ loading: true });
      const response = await adminReviewService.list(
        keyword,
        rating,
        visibility,
        page,
        limit,
        sortKey,
        sortValue,
      );
      set({
        reviews: response.data,
        totalItems: response.totalItems,
        totalPages: response.totalPages,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi khi tải danh sách đánh giá:", error);
      set({ loading: false });
      throw error;
    }
  },

  getReviewDetail: async (reviewId: string) => {
    try {
      const response = await adminReviewService.detail(reviewId);
      set({ currentReview: response.data });
    } catch (error) {
      console.error("Lỗi khi tải chi tiết đánh giá:", error);
      throw error;
    }
  },

  replyReview: async (reviewId: string, content: string) => {
    try {
      const response = await adminReviewService.reply(reviewId, content);
      const updated = response.data;
      toast.success("Đã phản hồi đánh giá thành công");
      set((state) => ({
        currentReview:
          state.currentReview?._id === reviewId ? updated : state.currentReview,
        reviews: state.reviews.map((r) =>
          r._id === reviewId ? { ...r, ...updated } : r,
        ),
      }));
      return updated;
    } catch (error) {
      console.error("Lỗi khi phản hồi đánh giá:", error);
      toast.error(error.response?.data?.message || "Phản hồi thất bại");
      throw error;
    }
  },

  deleteReply: async (reviewId: string) => {
    try {
      const response = await adminReviewService.deleteReply(reviewId);
      const updated = response.data;
      toast.success("Đã xóa phản hồi thành công");
      set((state) => ({
        currentReview:
          state.currentReview?._id === reviewId ? updated : state.currentReview,
        reviews: state.reviews.map((r) =>
          r._id === reviewId
            ? {
                ...r,
                ...updated,
                adminReply: {
                  content: "",
                  repliedAt: null,
                  repliedBy: null,
                },
              }
            : r,
        ),
      }));
      return updated;
    } catch (error) {
      console.error("Lỗi khi xóa phản hồi:", error);
      toast.error("Xóa phản hồi thất bại");
      throw error;
    }
  },

  toggleHidden: async (reviewId: string) => {
    try {
      const response = await adminReviewService.toggleHidden(reviewId);
      const nowHidden = response.data.isHidden;
      toast.success(nowHidden ? "Đã ẩn đánh giá" : "Đã hiện đánh giá");
      set((state) => ({
        reviews: state.reviews.map((r) =>
          r._id === reviewId ? { ...r, isHidden: nowHidden } : r,
        ),
        currentReview:
          state.currentReview?._id === reviewId
            ? { ...state.currentReview, isHidden: nowHidden }
            : state.currentReview,
      }));
      return { isHidden: nowHidden };
    } catch (error) {
      console.error("Lỗi khi ẩn/hiện đánh giá:", error);
      toast.error("Cập nhật trạng thái thất bại");
      throw error;
    }
  },

  clearCurrentReview: () => {
    set({ currentReview: null });
  },
}));

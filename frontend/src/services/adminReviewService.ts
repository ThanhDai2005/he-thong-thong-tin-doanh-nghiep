import api from "@/lib/adminAxios";

export const adminReviewService = {
  stats: async () => {
    const response = await api.get("/admin/review/stats");
    return response.data;
  },

  list: async (
    keyword: string,
    rating: string,
    visibility: string,
    page: number,
    limit: number,
    sortKey?: string,
    sortValue?: string,
  ) => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (rating && rating !== "all") params.set("rating", rating);
    if (visibility && visibility !== "all")
      params.set("visibility", visibility);
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (sortKey) params.set("sortKey", sortKey);
    if (sortValue) params.set("sortValue", sortValue);

    const response = await api.get(`/admin/review?${params.toString()}`);
    return response.data;
  },

  detail: async (reviewId: string) => {
    const response = await api.get(`/admin/review/detail/${reviewId}`);
    return response.data;
  },

  reply: async (reviewId: string, content: string) => {
    const response = await api.patch(`/admin/review/reply/${reviewId}`, {
      content,
    });
    return response.data;
  },

  deleteReply: async (reviewId: string) => {
    const response = await api.patch(
      `/admin/review/delete-reply/${reviewId}`,
    );
    return response.data;
  },

  toggleHidden: async (reviewId: string) => {
    const response = await api.patch(
      `/admin/review/toggle-hidden/${reviewId}`,
    );
    return response.data;
  },
};

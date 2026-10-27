import api from "@/lib/axios";

export const blogService = {
  getList: async (
    keyword = "",
    blogCategorySlug = "",
    page = 1,
    limit = 12,
  ) => {
    const response = await api.get(
      `/blog?keyword=${keyword}&blogCategorySlug=${blogCategorySlug}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (slug: string) => {
    const response = await api.get(`/blog/${slug}`);
    return response.data;
  },
};

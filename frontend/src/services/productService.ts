import api from "@/lib/axios";

export const productService = {
  getList: async (
    keyword = "",
    categorySlug = "",
    page = 1,
    limit = 10,
    sortKey = "",
    sortValue = "",
    minPrice = "",
    maxPrice = "",
    hasPromotion = "",
  ) => {
    const response = await api.get(
      `/product?keyword=${keyword}&categorySlug=${categorySlug}&page=${page}&limit=${limit}&sortKey=${sortKey}&sortValue=${sortValue}&minPrice=${minPrice}&maxPrice=${maxPrice}&hasPromotion=${hasPromotion}`,
    );
    return response.data;
  },

  getDetail: async (slug: string) => {
    const response = await api.get(`/product/${slug}`);
    return response.data;
  },
};

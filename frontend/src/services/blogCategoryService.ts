import api from "@/lib/axios";

export const blogCategoryService = {
  getList: async () => {
    const response = await api.get("/blog-category");
    return response.data;
  },
};

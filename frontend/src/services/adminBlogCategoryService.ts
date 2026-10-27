import api from "@/lib/adminAxios";

export const adminBlogCategoryService = {
  getList: async (keyword = "", status = "", page = 1, limit = 10) => {
    const response = await api.get(
      `/admin/blog-category?keyword=${keyword}&status=${status}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (blogCategoryId: string) => {
    const response = await api.get(`/admin/blog-category/${blogCategoryId}`);
    return response.data;
  },

  create: async (data: { name: string; status?: string }) => {
    const response = await api.post("/admin/blog-category", data);
    return response.data;
  },

  update: async (
    blogCategoryId: string,
    data: { name?: string; status?: string },
  ) => {
    const response = await api.patch(
      `/admin/blog-category/update/${blogCategoryId}`,
      data,
    );
    return response.data;
  },

  changeStatus: async (
    blogCategoryId: string,
    status: "active" | "inactive",
  ) => {
    const response = await api.patch(
      `/admin/blog-category/change-status/${status}/${blogCategoryId}`,
    );
    return response.data;
  },

  changeMulti: async (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => {
    const response = await api.patch(`/admin/blog-category/change-multi`, {
      ids,
      type,
    });
    return response.data;
  },

  deleteItem: async (blogCategoryId: string) => {
    const response = await api.patch(
      `/admin/blog-category/delete/${blogCategoryId}`,
    );
    return response.data;
  },
};

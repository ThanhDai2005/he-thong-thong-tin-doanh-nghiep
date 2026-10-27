import adminApi from "@/lib/adminAxios";

export const adminCategoryService = {
  getList: async (keyword = "", status = "", page = 1, limit = 10) => {
    const response = await adminApi.get(
      `/admin/category?keyword=${keyword}&status=${status}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (categoryId: string) => {
    const response = await adminApi.get(`/admin/category/${categoryId}`);
    return response.data;
  },

  create: async (data: { name: string; status?: string }) => {
    const response = await adminApi.post("/admin/category", data);
    return response.data;
  },

  update: async (
    categoryId: string,
    data: { name?: string; status?: string },
  ) => {
    const response = await adminApi.patch(
      `/admin/category/update/${categoryId}`,
      data,
    );
    return response.data;
  },

  changeStatus: async (categoryId: string, status: "active" | "inactive") => {
    const response = await adminApi.patch(
      `/admin/category/change-status/${status}/${categoryId}`,
    );
    return response.data;
  },

  changeMulti: async (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => {
    const response = await adminApi.patch("/admin/category/change-multi", {
      ids,
      type,
    });
    return response.data;
  },

  deleteItem: async (categoryId: string) => {
    const response = await adminApi.patch(`/admin/category/delete/${categoryId}`);
    return response.data;
  },
};

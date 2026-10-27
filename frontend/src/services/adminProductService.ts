import adminApi from "@/lib/adminAxios";

export const adminProductService = {
  getList: async (
    keyword = "",
    categorySlug = "",
    status = "",
    page = 1,
    limit = 10,
  ) => {
    const response = await adminApi.get(
      `/admin/product?keyword=${keyword}&categorySlug=${categorySlug}&status=${status}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (productId: string) => {
    const response = await adminApi.get(`/admin/product/${productId}`);
    return response.data;
  },

  create: async (
    data:
      | FormData
      | {
          name: string;
          description: string;
          ingredients: string;
          category: string;
          price: number;
          images?: string[];
          stock?: number;
          status?: string;
        },
  ) => {
    const response = await adminApi.post("/admin/product", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  update: async (
    productId: string,
    data:
      | FormData
      | {
          name?: string;
          description?: string;
          ingredients?: string;
          category?: string;
          price?: number;
          images?: string[];
          stock?: number;
          status?: string;
        },
  ) => {
    const response = await adminApi.patch(
      `/admin/product/update/${productId}`,
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  changeStatus: async (productId: string, status: "active" | "inactive") => {
    const response = await adminApi.patch(
      `/admin/product/change-status/${status}/${productId}`,
    );
    return response.data;
  },

  changeMulti: async (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => {
    const response = await adminApi.patch(`/admin/product/change-multi`, {
      ids,
      type,
    });
    return response.data;
  },

  deleteItem: async (productId: string) => {
    const response = await adminApi.patch(`/admin/product/delete/${productId}`);
    return response.data;
  },
};

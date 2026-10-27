import adminApi from "@/lib/adminAxios";

export const adminBlogService = {
  getList: async (
    keyword = "",
    blogCategorySlug = "",
    status = "",
    page = 1,
    limit = 10,
  ) => {
    const response = await adminApi.get(
      `/admin/blog?keyword=${keyword}&blogCategorySlug=${blogCategorySlug}&status=${status}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (blogId: string) => {
    const response = await adminApi.get(`/admin/blog/${blogId}`);
    return response.data;
  },

  create: async (
    data:
      | FormData
      | {
          title: string;
          content: string;
          imageUrl: string;
          blogCategory?: string;
          featured?: boolean;
          relatedProducts?: string[];
          status?: string;
        },
  ) => {
    const response = await adminApi.post("/admin/blog", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  update: async (
    blogId: string,
    data:
      | FormData
      | {
          title?: string;
          content?: string;
          imageUrl?: string;
          blogCategory?: string;
          featured?: boolean;
          relatedProducts?: string[];
          status?: string;
        },
  ) => {
    const response = await adminApi.patch(`/admin/blog/update/${blogId}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  changeStatus: async (blogId: string, status: "active" | "inactive") => {
    const response = await adminApi.patch(
      `/admin/blog/change-status/${status}/${blogId}`,
    );
    return response.data;
  },

  changeMulti: async (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => {
    const response = await adminApi.patch(`/admin/blog/change-multi`, {
      ids,
      type,
    });
    return response.data;
  },

  deleteItem: async (blogId: string) => {
    const response = await adminApi.patch(`/admin/blog/delete/${blogId}`);
    return response.data;
  },
};

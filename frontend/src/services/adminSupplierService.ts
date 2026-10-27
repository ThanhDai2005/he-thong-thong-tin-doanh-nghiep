import adminApi from "@/lib/adminAxios";

export const adminSupplierService = {
  getList: async (keyword = "", status = "", page = 1, limit = 10) => {
    const response = await adminApi.get(
      `/admin/supplier?keyword=${keyword}&status=${status}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (supplierId: string) => {
    const response = await adminApi.get(`/admin/supplier/${supplierId}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    phone: string;
    email: string;
    address: string;
    taxCode?: string;
    status?: string;
  }) => {
    const response = await adminApi.post("/admin/supplier", data);
    return response.data;
  },

  update: async (
    supplierId: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      taxCode?: string;
      status?: string;
    },
  ) => {
    const response = await adminApi.patch(
      `/admin/supplier/update/${supplierId}`,
      data,
    );
    return response.data;
  },

  changeStatus: async (supplierId: string, status: "active" | "inactive") => {
    const response = await adminApi.patch(
      `/admin/supplier/change-status/${status}/${supplierId}`,
    );
    return response.data;
  },

  changeMulti: async (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => {
    const response = await adminApi.patch("/admin/supplier/change-multi", {
      ids,
      type,
    });
    return response.data;
  },

  deleteItem: async (supplierId: string) => {
    const response = await adminApi.patch(
      `/admin/supplier/delete/${supplierId}`,
    );
    return response.data;
  },
};

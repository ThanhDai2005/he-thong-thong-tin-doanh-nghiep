import api from "@/lib/adminAxios";

export const adminStaffService = {
  list: async (
    keyword = "",
    roleId = "",
    status = "",
    page = 1,
    limit = 10,
  ) => {
    const response = await api.get(
      `/admin/staff?keyword=${keyword}&roleId=${roleId}&status=${status}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (staffId: string) => {
    const response = await api.get(`/admin/staff/${staffId}`);
    return response.data;
  },

  create: async (data: {
    displayName: string;
    email: string;
    phone: string;
    password: string;
    roleId: string;
    status?: string;
  }) => {
    const response = await api.post("/admin/staff", data);
    return response.data;
  },

  update: async (
    staffId: string,
    data: {
      displayName?: string;
      email?: string;
      phone?: string;
      password?: string;
      roleId?: string;
      status?: string;
    },
  ) => {
    const response = await api.patch(
      `/admin/staff/update/${staffId}`,
      data,
    );
    return response.data;
  },

  changeStatus: async (staffId: string, status: string) => {
    const response = await api.patch(
      `/admin/staff/change-status/${staffId}`,
      {
        status,
      },
    );
    return response.data;
  },

  changeMulti: async (ids: string[], type: "active" | "inactive" | "delete-all") => {
    const response = await api.patch("/admin/staff/change-multi", {
      ids,
      type,
    });
    return response.data;
  },

  deleteItem: async (staffId: string) => {
    const response = await api.patch(`/admin/staff/delete/${staffId}`);
    return response.data;
  },
};

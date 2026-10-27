import api from "@/lib/adminAxios";

export const adminRoleService = {
  list: async (keyword: string, page: number, limit: number) => {
    const response = await api.get(
      `/admin/role?keyword=${keyword}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (roleId: string) => {
    const response = await api.get(`/admin/role/detail/${roleId}`);
    return response.data;
  },

  create: async (data: { title: string; description?: string }) => {
    const response = await api.post("/admin/role", data);
    return response.data;
  },

  update: async (
    roleId: string,
    data: { title?: string; description?: string },
  ) => {
    const response = await api.patch(
      `/admin/role/update/${roleId}`,
      data,
    );
    return response.data;
  },

  deleteItem: async (roleId: string) => {
    const response = await api.patch(`/admin/role/delete/${roleId}`);
    return response.data;
  },

  getPermissions: async () => {
    const response = await api.get("/admin/role/permissions");
    return response.data;
  },

  updatePermissions: async (roleId: string, permissions: string[]) => {
    const response = await api.patch(
      `/admin/role/${roleId}/permissions`,
      { permissions },
    );
    return response.data;
  },
};

import api from "@/lib/adminAxios";

export const adminAuthService = {
  login: async (phone: string, password: string) => {
    const response = await api.post("/admin/auth/login", { phone, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/admin/auth/logout");
    return response.data;
  },

  getDetail: async () => {
    const response = await api.get("/admin/user/detail");
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post("/admin/auth/refresh");
    return response.data;
  },
};

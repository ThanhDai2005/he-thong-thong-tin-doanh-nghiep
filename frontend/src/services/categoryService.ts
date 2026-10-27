import api from "@/lib/axios";

export const categoryService = {
  getList: async () => {
    const response = await api.get("/category");
    return response.data;
  },
};

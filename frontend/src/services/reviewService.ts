import api from "@/lib/axios";

export const reviewService = {
  create: async (formData: FormData) => {
    const response = await api.post("/review", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getList: async (productId: string, page = 1, limit = 5) => {
    const response = await api.get(
      `/review/${productId}?page=${page}&limit=${limit}`,
    );
    return response.data;
  },
};

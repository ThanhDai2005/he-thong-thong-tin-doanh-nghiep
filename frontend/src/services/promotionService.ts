import api from "@/lib/axios";

export const promotionService = {
  getCollectible: async () => {
    const response = await api.get("/promotion/collectible");
    return response.data;
  },

  collectVoucher: async (promotionId: string) => {
    const response = await api.post(`/promotion/collect/${promotionId}`);
    return response.data;
  },

  getAvailable: async () => {
    const response = await api.get("/promotion/available");
    return response.data;
  },

  calculate: async (
    orderValue: number,
    orderPromotionId?: string,
    customerVoucherId?: string,
  ) => {
    const response = await api.post("/promotion/calculate", {
      orderValue,
      orderPromotionId,
      customerVoucherId,
    });
    return response.data;
  },
};

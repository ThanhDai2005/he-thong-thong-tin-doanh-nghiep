import { create } from "zustand";
import { promotionService } from "@/services/promotionService";
import type { PromotionState } from "@/types/store";
import type { AvailablePromotion } from "@/types/promotion";

export const usePromotionStore = create<PromotionState>((set) => ({
  availablePromotions: null,
  collectibleVouchers: [],
  appliedPromotion: null,
  discountResult: null,
  loading: false,
  collectLoading: false,

  getCollectibleVouchers: async () => {
    set({ loading: true });
    try {
      const response = await promotionService.getCollectible();
      set({ collectibleVouchers: response.data, loading: false });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách voucher:", error);
      set({ loading: false });
      throw error;
    }
  },

  collectVoucher: async (promotionId: string) => {
    set({ collectLoading: true });
    try {
      await promotionService.collectVoucher(promotionId);
      // Cập nhật local state: đánh dấu voucher này đã collected
      set((state) => ({
        collectibleVouchers: state.collectibleVouchers.map((v) =>
          v.promotion._id === promotionId ? { ...v, isCollected: true } : v,
        ),
        collectLoading: false,
      }));
    } catch (error) {
      console.error("Lỗi khi thu thập voucher:", error);
      set({ collectLoading: false });
      throw error;
    }
  },

  getAvailablePromotions: async () => {
    set({ loading: true });
    try {
      const response = await promotionService.getAvailable();
      set({ availablePromotions: response.data, loading: false });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khuyến mãi:", error);
      set({ loading: false });
      throw error;
    }
  },

  // Áp dụng bằng mã code (luồng cũ - nhập tay)
  applyPromotion: async (code: string, orderValue: number) => {
    set({ loading: true });
    try {
      // Lấy danh sách available để tìm theo code
      const listRes = await promotionService.getAvailable();
      const { orderPromotions, customerVouchers } = listRes.data as {
        orderPromotions: AvailablePromotion[];
        customerVouchers: AvailablePromotion[];
      };

      const allPromos = [...orderPromotions, ...customerVouchers];
      const matched = allPromos.find(
        (p) => p.promotion.code.toUpperCase() === code.toUpperCase(),
      );

      if (!matched) {
        set({ loading: false });
        throw {
          response: {
            data: {
              message: "Mã khuyến mãi không tồn tại hoặc không áp dụng được",
            },
          },
        };
      }

      const orderPromotionId =
        matched.type === "orderPromotion"
          ? matched.orderPromotionId
          : undefined;
      const customerVoucherId =
        matched.type === "customerVoucher" ? matched.voucherId : undefined;

      const calcRes = await promotionService.calculate(
        orderValue,
        orderPromotionId,
        customerVoucherId,
      );
      const result = calcRes.data;

      set({
        appliedPromotion: {
          type: matched.type,
          orderPromotionId,
          customerVoucherId,
          code: matched.promotion.code,
          title: matched.promotion.title,
          discountAmount: result.discountAmount,
        },
        discountResult: result,
        availablePromotions: listRes.data,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi khi áp dụng mã khuyến mãi:", error);
      set({ loading: false });
      throw error;
    }
  },

  // Áp dụng bằng chọn từ dropdown (luồng mới - chọn từ danh sách)
  applyPromotionById: async (
    selectedPromo: AvailablePromotion,
    orderValue: number,
  ) => {
    set({ loading: true });
    try {
      const orderPromotionId =
        selectedPromo.type === "orderPromotion"
          ? selectedPromo.orderPromotionId
          : undefined;
      const customerVoucherId =
        selectedPromo.type === "customerVoucher"
          ? selectedPromo.voucherId
          : undefined;

      const calcRes = await promotionService.calculate(
        orderValue,
        orderPromotionId,
        customerVoucherId,
      );
      const result = calcRes.data;

      set({
        appliedPromotion: {
          type: selectedPromo.type,
          orderPromotionId,
          customerVoucherId,
          code: selectedPromo.promotion.code,
          title: selectedPromo.promotion.title,
          discountAmount: result.discountAmount,
        },
        discountResult: result,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi khi áp dụng khuyến mãi:", error);
      set({ loading: false });
      throw error;
    }
  },

  calculateDiscount: async (
    orderValue,
    orderPromotionId,
    customerVoucherId,
  ) => {
    set({ loading: true });
    try {
      const response = await promotionService.calculate(
        orderValue,
        orderPromotionId,
        customerVoucherId,
      );
      const result = response.data;
      set({ discountResult: result, loading: false });
      return result;
    } catch (error) {
      console.error("Lỗi khi tính giảm giá:", error);
      set({ loading: false });
      throw error;
    }
  },

  clearPromotion: () => {
    set({ appliedPromotion: null, discountResult: null });
  },
}));

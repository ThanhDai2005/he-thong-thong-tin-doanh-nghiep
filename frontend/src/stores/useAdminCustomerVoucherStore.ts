import { create } from "zustand";
import { adminCustomerVoucherService } from "@/services/adminCustomerVoucherService";
import { toast } from "sonner";
import type { AdminCustomerVoucherStore } from "@/types/store";

export const useAdminCustomerVoucherStore = create<AdminCustomerVoucherStore>(
  (set) => ({
    customerVouchers: [],
    currentCustomerVoucher: null,
    loading: false,
    totalPages: 1,

    fetchCustomerVouchers: async (
      keyword = "",
      status = "",
      page = 1,
      limit = 10,
    ) => {
      try {
        set({ loading: true });
        const response = await adminCustomerVoucherService.list(
          keyword,
          status,
          page,
          limit,
        );
        set({
          customerVouchers: response.data,
          totalPages: response.totalPages,
          loading: false,
        });
      } catch (error) {
        console.error("Lỗi khi tải danh sách voucher khách hàng:", error);
        set({ loading: false });
        throw error;
      }
    },

    getDetail: async (promotionId: string) => {
      try {
        set({ loading: true });
        const response =
          await adminCustomerVoucherService.getDetail(promotionId);
        set({ currentCustomerVoucher: response.data, loading: false });
      } catch (error) {
        console.error("Lỗi khi tải chi tiết voucher khách hàng:", error);
        set({ loading: false });
        toast.error("Không thể tải chi tiết voucher");
        throw error;
      }
    },

    create: async (data) => {
      try {
        set({ loading: true });
        const response = await adminCustomerVoucherService.create(data);
        set({ loading: false });
        toast.success(response.message || "Tạo voucher thành công");
      } catch (error) {
        console.error("Lỗi khi tạo voucher:", error);
        set({ loading: false });
        toast.error(error?.response?.data?.message || "Tạo voucher thất bại");
        throw error;
      }
    },

    issueVoucher: async (promotionId: string, customerIds: string[]) => {
      try {
        set({ loading: true });
        const response = await adminCustomerVoucherService.issueVoucher(
          promotionId,
          customerIds,
        );
        set({ loading: false });
        toast.success(response.message || "Phát voucher thành công");
      } catch (error) {
        console.error("Lỗi khi phát voucher:", error);
        set({ loading: false });
        toast.error(error?.response?.data?.message || "Phát voucher thất bại");
        throw error;
      }
    },
  }),
);

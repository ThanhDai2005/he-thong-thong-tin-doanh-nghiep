import { create } from "zustand";
import type { AdminStockReceiptState } from "@/types/store";
import { adminStockReceiptService } from "@/services/adminStockReceiptService";
import { toast } from "sonner";

export const useAdminStockReceiptStore = create<AdminStockReceiptState>(
  (set) => ({
    receipts: [],
    currentReceipt: null,
    totalPages: 1,
    totalItems: 0,
    loading: false,

    fetchReceipts: async (
      keyword = "",
      status = "",
      supplierId = "",
      startDate = "",
      endDate = "",
      page = 1,
      limit = 10,
    ) => {
      try {
        set({ loading: true });
        const response = await adminStockReceiptService.getList(
          keyword,
          status,
          supplierId,
          startDate,
          endDate,
          page,
          limit,
        );
        set({
          receipts: response.data,
          totalPages: response.totalPages,
          totalItems: response.totalItems,
          loading: false,
        });
      } catch (error) {
        console.error("Lỗi khi tải danh sách phiếu nhập:", error);
        set({ loading: false });
      }
    },

    getReceiptDetail: async (receiptId) => {
      try {
        set({ loading: true });
        const response = await adminStockReceiptService.getDetail(receiptId);
        set({ currentReceipt: response.data, loading: false });
        return response.data;
      } catch (error) {
        console.error("Lỗi khi tải chi tiết phiếu nhập:", error);
        set({ loading: false });
        throw error;
      }
    },

    createReceipt: async (data) => {
      try {
        set({ loading: true });
        const response = await adminStockReceiptService.create(data);
        toast.success("Tạo phiếu nhập thành công");
        set({ loading: false });
        return response.data;
      } catch (error) {
        console.error("Lỗi khi tạo phiếu nhập:", error);
        toast.error("Không thể tạo phiếu nhập");
        set({ loading: false });
        throw error;
      }
    },

    confirmReceipt: async (receiptId) => {
      try {
        set({ loading: true });
        await adminStockReceiptService.confirm(receiptId);
        toast.success("Xác nhận phiếu nhập thành công! Kho đã được cập nhật.");
        set({ loading: false });
      } catch (error) {
        console.error("Lỗi khi xác nhận phiếu nhập:", error);
        toast.error("Không thể xác nhận phiếu nhập");
        set({ loading: false });
        throw error;
      }
    },

    cancelReceipt: async (receiptId) => {
      try {
        set({ loading: true });
        await adminStockReceiptService.cancel(receiptId);
        toast.success("Hủy phiếu nhập thành công");
        set({ loading: false });
      } catch (error) {
        console.error("Lỗi khi hủy phiếu nhập:", error);
        toast.error("Không thể hủy phiếu nhập");
        set({ loading: false });
        throw error;
      }
    },

    clearCurrentReceipt: () => set({ currentReceipt: null }),
  }),
);

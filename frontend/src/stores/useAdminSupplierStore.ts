import { create } from "zustand";
import type { AdminSupplierState } from "@/types/store";
import { adminSupplierService } from "@/services/adminSupplierService";
import { toast } from "sonner";

export const useAdminSupplierStore = create<AdminSupplierState>((set) => ({
  suppliers: [],
  currentSupplier: null,
  totalPages: 1,
  totalItems: 0,
  loading: false,

  fetchSuppliers: async (keyword = "", status = "", page = 1, limit = 10) => {
    try {
      set({ loading: true });
      const response = await adminSupplierService.getList(
        keyword,
        status,
        page,
        limit,
      );
      set({
        suppliers: response.data,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi khi tải danh sách nhà cung cấp:", error);
      set({ loading: false });
    }
  },

  getSupplierDetail: async (supplierId) => {
    try {
      set({ loading: true });
      const response = await adminSupplierService.getDetail(supplierId);
      set({ currentSupplier: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải chi tiết nhà cung cấp:", error);
      toast.error("Không thể tải thông tin nhà cung cấp");
      set({ loading: false });
      throw error;
    }
  },

  createSupplier: async (data) => {
    try {
      set({ loading: true });
      await adminSupplierService.create(data);
      toast.success("Tạo nhà cung cấp thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi tạo nhà cung cấp:", error);
      toast.error("Không thể tạo nhà cung cấp");
      set({ loading: false });
      throw error;
    }
  },

  updateSupplier: async (supplierId, data) => {
    try {
      set({ loading: true });
      await adminSupplierService.update(supplierId, data);
      toast.success("Cập nhật nhà cung cấp thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi cập nhật nhà cung cấp:", error);
      toast.error("Không thể cập nhật nhà cung cấp");
      set({ loading: false });
      throw error;
    }
  },

  changeStatus: async (supplierId, status) => {
    try {
      set({ loading: true });
      await adminSupplierService.changeStatus(supplierId, status);
      toast.success("Cập nhật trạng thái thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      toast.error("Không thể cập nhật trạng thái");
      set({ loading: false });
      throw error;
    }
  },

  changeMulti: async (ids, type) => {
    try {
      set({ loading: true });
      await adminSupplierService.changeMulti(ids, type);
      const messages = {
        active: "Kích hoạt các nhà cung cấp thành công",
        inactive: "Ngưng hoạt động các nhà cung cấp thành công",
        "delete-all": "Xóa các nhà cung cấp thành công",
      };
      toast.success(messages[type]);
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi thao tác hàng loạt:", error);
      toast.error("Không thể thực hiện thao tác");
      set({ loading: false });
      throw error;
    }
  },

  deleteItem: async (supplierId) => {
    try {
      set({ loading: true });
      await adminSupplierService.deleteItem(supplierId);
      toast.success("Xóa nhà cung cấp thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi xóa nhà cung cấp:", error);
      toast.error("Không thể xóa nhà cung cấp");
      set({ loading: false });
      throw error;
    }
  },
}));

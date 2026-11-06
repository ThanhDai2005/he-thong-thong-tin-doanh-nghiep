import { create } from "zustand";
import type { AdminCustomerStore } from "@/types/store";
import { adminCustomerService } from "@/services/adminCustomerService";
import { toast } from "sonner";

export const useAdminCustomerStore = create<AdminCustomerStore>((set) => ({
  customers: [],
  currentCustomer: null,
  report: null,
  totalPages: 1,
  loading: false,

  fetchCustomers: async (keyword = "", status = "", page = 1, limit = 10) => {
    try {
      set({ loading: true });
      const response = await adminCustomerService.getList(
        keyword,
        status,
        page,
        limit,
      );
      set({
        customers: response.data,
        totalPages: response.totalPages,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi khi tải danh sách khách hàng:", error);
      set({ loading: false });
      throw error;
    }
  },

  getDetail: async (customerId) => {
    try {
      set({ loading: true });
      const response = await adminCustomerService.getDetail(customerId);
      set({ currentCustomer: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải chi tiết khách hàng:", error);
      set({ loading: false });
      toast.error("Không thể tải chi tiết khách hàng");
      throw error;
    }
  },

  createCustomer: async (data) => {
    try {
      set({ loading: true });
      await adminCustomerService.create(data);
      toast.success("Tạo khách hàng thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi tạo khách hàng:", error);
      toast.error("Không thể tạo khách hàng");
      set({ loading: false });
      throw error;
    }
  },

  updateCustomer: async (customerId, data) => {
    try {
      set({ loading: true });
      await adminCustomerService.update(customerId, data);
      toast.success("Cập nhật khách hàng thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi cập nhật khách hàng:", error);
      toast.error("Không thể cập nhật khách hàng");
      set({ loading: false });
      throw error;
    }
  },

  changeStatus: async (customerId, status) => {
    try {
      set({ loading: true });
      await adminCustomerService.changeStatus(customerId, status);
      const message =
        status === "active"
          ? "Kích hoạt khách hàng thành công"
          : "Khóa khách hàng thành công";
      toast.success(message);
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái khách hàng:", error);
      toast.error("Thay đổi trạng thái thất bại");
      set({ loading: false });
      throw error;
    }
  },

  changeMulti: async (ids, type) => {
    try {
      set({ loading: true });
      const response = await adminCustomerService.changeMulti(ids, type);
      toast.success(response.message);
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi thao tác hàng loạt khách hàng:", error);
      toast.error("Thao tác hàng loạt thất bại");
      set({ loading: false });
      throw error;
    }
  },

  deleteItem: async (customerId) => {
    try {
      set({ loading: true });
      await adminCustomerService.delete(customerId);
      toast.success("Xóa khách hàng thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi xóa khách hàng:", error);
      toast.error("Xóa khách hàng thất bại");
      set({ loading: false });
      throw error;
    }
  },

  fetchReport: async () => {
    try {
      set({ loading: true });
      const response = await adminCustomerService.getReport();
      set({ report: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tải báo cáo khách hàng:", error);
      toast.error("Không thể tải báo cáo");
      set({ loading: false });
      throw error;
    }
  },
}));

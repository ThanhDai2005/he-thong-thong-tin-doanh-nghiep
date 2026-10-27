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
      toast.error("Không thể tải thông tin khách hàng");
      set({ loading: false });
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
      toast.success(
        `${status === "active" ? "Kích hoạt" : "Khóa"} tài khoản thành công`,
      );
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi đổi trạng thái:", error);
      toast.error("Không thể đổi trạng thái");
      set({ loading: false });
      throw error;
    }
  },

  changeMulti: async (type, ids) => {
    try {
      set({ loading: true });
      await adminCustomerService.changeMulti(type, ids);
      let message = "Thao tác thành công";
      if (type === "active") message = "Kích hoạt thành công";
      if (type === "inactive") message = "Khóa thành công";
      if (type === "delete-all") message = "Xóa thành công";
      toast.success(message);
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi thao tác hàng loạt:", error);
      toast.error("Không thể thực hiện thao tác");
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
      toast.error("Không thể xóa khách hàng");
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

  clearCurrentCustomer: () => {
    set({ currentCustomer: null });
  },
}));

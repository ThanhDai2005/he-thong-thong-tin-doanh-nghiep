import { create } from "zustand";
import { adminStaffService } from "@/services/adminStaffService";
import { toast } from "sonner";
import type { AdminStaffStore } from "@/types/store";

export const useAdminStaffStore = create<AdminStaffStore>((set) => ({
  staffs: [],
  currentStaff: null,
  loading: false,
  totalPages: 1,

  fetchStaffs: async (keyword = "", roleId = "", status = "", page = 1, limit = 10) => {
    try {
      set({ loading: true });
      const response = await adminStaffService.list(keyword, roleId, status, page, limit);
      set({
        staffs: response.data,
        totalPages: response.totalPages,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi khi tải danh sách nhân viên:", error);
      set({ loading: false });
      throw error;
    }
  },

  getDetail: async (staffId) => {
    try {
      set({ loading: true });
      const response = await adminStaffService.getDetail(staffId);
      set({ currentStaff: response.data, loading: false });
    } catch (error) {
      console.error("Lỗi khi tải chi tiết nhân viên:", error);
      set({ loading: false });
      toast.error("Không thể tải chi tiết nhân viên");
      throw error;
    }
  },

  createStaff: async (data) => {
    try {
      set({ loading: true });
      await adminStaffService.create(data);
      set({ loading: false });
      toast.success("Tạo nhân viên thành công");
    } catch (error) {
      console.error("Lỗi khi tạo nhân viên:", error);
      set({ loading: false });
      toast.error("Tạo nhân viên thất bại");
      throw error;
    }
  },

  updateStaff: async (staffId, data) => {
    try {
      set({ loading: true });
      await adminStaffService.update(staffId, data);
      set({ loading: false });
      toast.success("Cập nhật nhân viên thành công");
    } catch (error) {
      console.error("Lỗi khi cập nhật nhân viên:", error);
      set({ loading: false });
      toast.error("Cập nhật nhân viên thất bại");
      throw error;
    }
  },

  changeStatus: async (staffId, status) => {
    try {
      await adminStaffService.changeStatus(staffId, status);
      const message =
        status === "active"
          ? "Kích hoạt nhân viên thành công"
          : "Khóa nhân viên thành công";
      toast.success(message);
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái nhân viên:", error);
      toast.error("Thay đổi trạng thái thất bại");
      throw error;
    }
  },

  changeMulti: async (ids, type) => {
    try {
      const response = await adminStaffService.changeMulti(ids, type);
      toast.success(response.message);
    } catch (error) {
      console.error("Lỗi khi thao tác hàng loạt nhân viên:", error);
      toast.error("Thao tác hàng loạt thất bại");
      throw error;
    }
  },

  deleteItem: async (staffId) => {
    try {
      await adminStaffService.deleteItem(staffId);
      toast.success("Xóa nhân viên thành công");
    } catch (error) {
      console.error("Lỗi khi xóa nhân viên:", error);
      toast.error("Xóa nhân viên thất bại");
      throw error;
    }
  },
}));

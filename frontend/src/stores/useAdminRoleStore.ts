import { create } from "zustand";
import { toast } from "sonner";
import type { AdminRoleStore } from "@/types/store";
import { adminRoleService } from "@/services/adminRoleService";

export const useAdminRoleStore = create<AdminRoleStore>((set) => ({
  roles: [],
  currentRole: null,
  permissions: [],
  loading: false,
  totalPages: 1,

  fetchRoles: async (keyword = "", page = 1, limit = 10) => {
    try {
      set({ loading: true });
      const response = await adminRoleService.list(keyword, page, limit);
      set({
        roles: response.data,
        totalPages: response.totalPages,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi khi tải danh sách vai trò:", error);
      set({ loading: false });
      throw error;
    }
  },

  getRoleDetail: async (roleId: string) => {
    try {
      set({ loading: true });
      const response = await adminRoleService.getDetail(roleId);
      set({ currentRole: response.data, loading: false });
    } catch (error) {
      console.error("Lỗi khi tải chi tiết vai trò:", error);
      set({ loading: false });
      throw error;
    }
  },

  createRole: async (data: { title: string; description?: string }) => {
    try {
      set({ loading: true });
      await adminRoleService.create(data);
      toast.success("Tạo vai trò thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi tạo vai trò:", error);
      set({ loading: false });
      throw error;
    }
  },

  updateRole: async (
    roleId: string,
    data: { title?: string; description?: string },
  ) => {
    try {
      set({ loading: true });
      await adminRoleService.update(roleId, data);
      toast.success("Cập nhật vai trò thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi cập nhật vai trò:", error);
      set({ loading: false });
      throw error;
    }
  },

  deleteRole: async (roleId: string) => {
    try {
      set({ loading: true });
      await adminRoleService.deleteItem(roleId);
      toast.success("Xóa vai trò thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi xóa vai trò:", error);
      set({ loading: false });
      throw error;
    }
  },

  fetchPermissions: async () => {
    try {
      set({ loading: true });
      const response = await adminRoleService.getPermissions();
      set({ permissions: response.data, loading: false });
    } catch (error) {
      console.error("Lỗi khi tải danh sách quyền:", error);
      set({ loading: false });
      throw error;
    }
  },

  updatePermissions: async (roleId: string, permissions: string[]) => {
    try {
      set({ loading: true });
      await adminRoleService.updatePermissions(roleId, permissions);
      toast.success("Cập nhật quyền thành công");
      set({ loading: false });
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền:", error);
      set({ loading: false });
      throw error;
    }
  },

  clearCurrentRole: () => {
    set({ currentRole: null });
  },
}));

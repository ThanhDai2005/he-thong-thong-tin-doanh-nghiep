import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

export const useUserStore = create<UserState>()((set) => ({
  loading: false,

  uploadAvatar: async (formData) => {
    try {
      set({ loading: true });
      const { user, setUser } = useAuthStore.getState();
      const res = await userService.uploadAvatar(formData);
      if (user) {
        setUser({ ...user, avatarUrl: res.avatarUrl });
      }
    } catch (error) {
      console.log("Error uploadAvatar", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateInfo: async (displayName, email, phone, address, birthday?) => {
    try {
      set({ loading: true });
      const { user, setUser } = useAuthStore.getState();
      const res = await userService.updateInfo(
        displayName,
        email,
        phone,
        address,
        birthday,
      );
      if (user) {
        setUser({
          ...user,
          displayName: res.user.displayName,
          email: res.user.email,
          phone: res.user.phone,
          address: res.user.address,
          birthday: res.user.birthday,
        });
      }
    } catch (error) {
      console.log("Error updateInfo", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  changePassword: async (currentPassword, newPassword, confirmNewPassword) => {
    try {
      set({ loading: true });
      const res = await userService.changePassword(
        currentPassword,
        newPassword,
        confirmNewPassword,
      );
      return res;
    } catch (error) {
      console.log("Error changePassword", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));

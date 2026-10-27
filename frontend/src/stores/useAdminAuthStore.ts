import { adminAuthService } from "@/services/adminAuthService";
import type { AdminAuthState } from "@/types/store";
import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,

      setAccessToken: (accessToken) => {
        set({ accessToken: accessToken });
      },

      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        localStorage.removeItem("adminStorage");
      },

      login: async (phone, password) => {
        try {
          set({ loading: true });

          const res = await adminAuthService.login(phone, password);
          get().setAccessToken(res.accessToken);
          await get().getDetail();
          toast.success("Đăng nhập thành công");
          return res;
        } catch (error) {
          console.log(error);
          toast.error(error?.response?.data?.message || "Đăng nhập thất bại");
        } finally {
          set({ loading: false });
        }
      },

      logout: async () => {
        try {
          get().clearState();
          await adminAuthService.logout();
          toast.success("Logout thành công!");
        } catch (error) {
          console.log(error);
        }
      },

      getDetail: async () => {
        try {
          set({ loading: true });
          const res = await adminAuthService.getDetail();
          set({ user: res.user });
        } catch (error) {
          console.log(error);
        } finally {
          set({ loading: false });
        }
      },

      refreshToken: async () => {
        try {
          set({ loading: true });

          const { user, getDetail, setAccessToken } = get();
          const res = await adminAuthService.refreshToken();

          setAccessToken(res.accessToken);

          if (!user) {
            await getDetail();
          }
        } catch (error) {
          console.log(error);
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
          get().clearState(); // quan trọng: fail thì xóa user để không loop
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "adminStorage",
      partialize: (state) => ({ user: state.user }), // chỉ persist user
    },
  ),
);

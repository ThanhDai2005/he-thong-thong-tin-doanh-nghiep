import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";
import { useCartStore } from "./useCartStore";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,
      isAuthChecked: false,
      forgotPasswordLoading: false,

      setAccessToken: (accessToken) => {
        set({ accessToken: accessToken });
      },

      setUser: (user) => {
        set({ user });
      },

      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        useCartStore.getState().clearCart();
        localStorage.removeItem("authStorage");
        localStorage.removeItem("cart-storage");
      },

      signUp: async (firstName, lastName, phone, email, password) => {
        try {
          set({ loading: true });

          const res = await authService.signUp(
            firstName,
            lastName,
            phone,
            email,
            password,
          );

          toast.success(
            "Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập.",
          );

          return res;
        } catch (error) {
          console.error(error);
          toast.error(error?.response?.data?.message || "Đăng ký thất bại");
        } finally {
          set({ loading: false });
        }
      },

      signIn: async (phone, password) => {
        try {
          get().clearState();
          set({ loading: true });

          const res = await authService.signIn(phone, password);
          get().setAccessToken(res.accessToken);
          await get().getDetail();
          await useCartStore.getState().getCart();

          toast.success("Chào mừng bạn quay lại 🎉");
          return res;
        } catch (error) {
          console.error(error);
          toast.error(error?.response?.data?.message || "Đăng nhập thất bại");
        } finally {
          set({ loading: false });
        }
      },

      googleSignIn: async (credential) => {
        try {
          get().clearState();
          set({ loading: true });

          const res = await authService.googleAuth(credential);
          get().setAccessToken(res.accessToken);
          await get().getDetail();
          await useCartStore.getState().getCart();

          toast.success("Chào mừng bạn quay lại 🎉");
          return res;
        } catch (error) {
          console.error(error);
          toast.error(
            error?.response?.data?.message || "Đăng nhập Google thất bại",
          );
        } finally {
          set({ loading: false });
        }
      },

      checkAuth: async () => {
        if (get().isAuthChecked) return;

        try {
          if (!get().accessToken) {
            try {
              const res = await authService.refresh();
              get().setAccessToken(res.accessToken);
            } catch {
              if (get().user) {
                get().clearState();
              }
            }
          }

          if (get().accessToken && !get().user) {
            try {
              await get().getDetail();
            } catch {
              get().clearState();
            }
          }
        } finally {
          set({ isAuthChecked: true });
        }
      },

      signOut: async () => {
        try {
          get().clearState();
          await authService.signOut();
          toast.success("Logout thành công!");
        } catch (error) {
          console.error(error);
          toast.error("Lỗi xảy ra khi logout. Hãy thử lại!");
        }
      },

      getDetail: async () => {
        try {
          set({ loading: true });
          const user = await authService.getDetail();

          set({ user: user.user });
        } catch (error) {
          console.error(error);
          set({ user: null, accessToken: null });
          toast.error("Lỗi xảy ra khi lấy dữ liệu người dùng. Hãy thử lại!");
        } finally {
          set({ loading: false });
        }
      },

      refresh: async () => {
        try {
          set({ loading: true });
          const { user, getDetail, setAccessToken } = get();
          const res = await authService.refresh();

          setAccessToken(res.accessToken);

          if (!user) {
            await getDetail();
          }
        } catch (error) {
          console.error(error);
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
          get().clearState();
        } finally {
          set({ loading: false });
        }
      },

      forgotPassword: async (email) => {
        try {
          set({ forgotPasswordLoading: true });
          const res = await authService.forgotPassword(email);
          return res;
        } catch (error) {
          console.log(error);
          throw error;
        } finally {
          set({ forgotPasswordLoading: false });
        }
      },

      verifyOtp: async (email, otp) => {
        try {
          set({ loading: true });
          const res = await authService.verifyOtp(email, otp);
          return res;
        } catch (error) {
          console.log(error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      resetPassword: async (resetToken, newPassword, confirmPassword) => {
        try {
          set({ loading: true });
          const res = await authService.resetPassword(
            resetToken,
            newPassword,
            confirmPassword,
          );
          return res;
        } catch (error) {
          console.log(error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "authStorage",
      partialize: (state) => ({ user: state.user }), // chỉ persist user
    },
  ),
);

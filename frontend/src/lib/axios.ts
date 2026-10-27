import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // giúp gửi cookie lên server
});

// Tự động gắn token vào header cho mọi request
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
export default api;

// Tự động gọi refresh api khi accessToken hết hạn

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config; //{ url: "/users/me", method: "get", headers: {...}}

    // Bỏ qua các API Auth tránh vòng lặp vô hạn
    if (
      originalRequest.url.includes("/auth/signup") ||
      originalRequest.url.includes("/auth/signin") ||
      originalRequest.url.includes("/auth/refresh") ||
      originalRequest.url.includes("/forgot-password") ||
      originalRequest.url.includes("/verify-otp")
    ) {
      return Promise.reject(error);
    }

    // đếm số lần đã thử lại yêu cầu này.
    originalRequest._retryCount = originalRequest._retryCount || 0;

    if (error.response?.status == 401 && originalRequest._retryCount < 4) {
      originalRequest._retryCount += 1;

      console.log("refresh", originalRequest._retryCount);
      try {
        const res = await api.post(
          "/auth/refresh",
          {},
          { withCredentials: true },
        );
        const newAccessToken = res.data.accessToken;
        useAuthStore.getState().setAccessToken(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest); //Request cũ: api.get("/users/me"); Sau khi refresh xong: return api({url: "/users/me", method: "get", headers: { Authorization: "Bearer NEW_TOKEN" }});
      } catch (error) {
        console.log(error);
        useAuthStore.getState().clearState();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

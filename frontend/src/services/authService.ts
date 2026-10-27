import api from "@/lib/axios";

export const authService = {
  signUp: async (
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    password: string,
  ) => {
    const res = await api.post(
      "/auth/signup",
      {
        firstName,
        lastName,
        phone,
        email,
        password,
      },
      { withCredentials: true },
    );

    return res.data;
  },

  signIn: async (phone: string, password: string) => {
    const res = await api.post(
      "/auth/signin",
      {
        phone,
        password,
      },
      { withCredentials: true },
    );

    return res.data;
  },

  googleAuth: async (credential: string) => {
    const res = await api.post(
      "/auth/google",
      {
        credential,
      },
      { withCredentials: true },
    );

    return res.data;
  },

  signOut: async () => {
    const res = await api.post(
      "/auth/signout",
      {},
      {
        withCredentials: true,
      },
    );
    return res.data;
  },

  getDetail: async () => {
    const res = await api.get("/user/detail", {
      withCredentials: true,
    });
    return res.data;
  },

  refresh: async () => {
    const res = await api.post("/auth/refresh", {}, { withCredentials: true });
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post("/auth/forgot-password", {
      email: email,
    });

    return res.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const res = await api.post("/auth/verify-otp", {
      email: email,
      otp: otp,
    });

    return res.data;
  },

  resetPassword: async (
    resetToken: string,
    newPassword: string,
    confirmPassword: string,
  ) => {
    const res = await api.post("/auth/reset-password", {
      resetToken: resetToken,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    });

    return res.data;
  },
};

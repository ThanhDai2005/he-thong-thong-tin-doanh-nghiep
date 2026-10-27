import api from "@/lib/axios";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.patch("/user/uploadAvatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },

  updateInfo: async (
    displayName: string,
    email: string,
    phone: string,
    address: string,
    birthday?: string,
  ) => {
    const res = await api.patch("/user/profile", {
      displayName,
      email,
      phone,
      address,
      birthday,
    });

    return res.data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string,
  ) => {
    const res = await api.patch("/user/change-password", {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });

    return res.data;
  },
};

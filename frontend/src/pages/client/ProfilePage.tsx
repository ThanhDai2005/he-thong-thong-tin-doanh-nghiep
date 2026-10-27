import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "sonner";
import { useEffect } from "react";

const profileSchema = z.object({
  displayName: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z
    .string()
    .regex(/^(03|05|07|08|09)\d{8}$/, "Số điện thoại không hợp lệ"),
  address: z.string().optional(),
  birthday: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "Mật khẩu hiện tại phải có ít nhất 6 ký tự"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmNewPassword: z.string().min(6, "Xác nhận mật khẩu mới bắt buộc"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu mới không khớp",
    path: ["confirmNewPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { uploadAvatar, updateInfo, changePassword, loading } = useUserStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!user) return;

    setValue("displayName", user.displayName || "");
    setValue("email", user.email || "");
    setValue("phone", user.phone || "");
    setValue("address", user.address || "");

    // Format birthday to YYYY-MM-DD for input type="date"
    if (user.birthday) {
      const date = new Date(user.birthday);
      const formattedDate = date.toISOString().split("T")[0];
      setValue("birthday", formattedDate);
    }
  }, [user, setValue]);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await uploadAvatar(formData);
      toast.success("Cập nhật ảnh đại diện thành công");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tải ảnh lên");
    }
  };

  const onSubmitProfile = async (data: ProfileForm) => {
    try {
      await updateInfo(
        data.displayName,
        data.email,
        data.phone,
        data.address || "",
        data.birthday || undefined,
      );
      toast.success("Cập nhật thông tin thành công");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Lỗi khi cập nhật thông tin",
      );
    }
  };

  const onSubmitPassword = async (data: PasswordForm) => {
    try {
      await changePassword(
        data.currentPassword,
        data.newPassword,
        data.confirmNewPassword,
      );
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      resetPasswordForm();
      // Redirect to signin after password change
      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi đổi mật khẩu");
    }
  };

  if (!user) return null;

  // Calculate max date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-10">Hồ sơ cá nhân</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Avatar */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="relative w-40 h-40 mx-auto mb-6 group">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-md">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#b51c00] flex items-center justify-center text-white text-6xl font-bold">
                    {user.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Camera Icon Overlay */}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all border border-gray-200"
              >
                <span className="material-symbols-outlined text-[#b51c00]">
                  photo_camera
                </span>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              {user.displayName}
            </h2>
            <p className="text-gray-500 mt-1">{user.email}</p>
          </div>
        </div>

        {/* Right Column - Forms */}
        <div className="lg:col-span-8 space-y-8">
          {/* Cập nhật thông tin */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-[#b51c00] text-2xl">
                edit_note
              </span>
              <h2 className="text-2xl font-bold">Cập nhật thông tin</h2>
            </div>

            <form
              onSubmit={handleSubmit(onSubmitProfile)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    {...register("displayName")}
                    className="w-full h-12 px-5 border border-gray-200 rounded-2xl focus:border-[#b51c00] focus:ring-1 focus:ring-[#b51c00] outline-none"
                  />
                  {errors.displayName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.displayName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    {...register("phone")}
                    readOnly
                    className="w-full h-12 px-5 border border-gray-200 rounded-2xl bg-gray-50 text-gray-400 cursor-not-allowed outline-none"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  {...register("email")}
                  className="w-full h-12 px-5 border border-gray-200 rounded-2xl focus:border-[#b51c00] focus:ring-1 focus:ring-[#b51c00] outline-none"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  {...register("birthday")}
                  min="1920-01-01"
                  max={today}
                  className="w-full h-12 px-5 border border-gray-200 rounded-2xl focus:border-[#b51c00] focus:ring-1 focus:ring-[#b51c00] outline-none"
                />
                {errors.birthday && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.birthday.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <textarea
                  {...register("address")}
                  rows={3}
                  className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:border-[#b51c00] focus:ring-1 focus:ring-[#b51c00] outline-none resize-none"
                  placeholder="Nhập địa chỉ giao hàng..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#b51c00] hover:bg-[#8e1400] text-white font-bold text-lg rounded-2xl transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>
          </div>

          {/* Đổi mật khẩu */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-[#b51c00] text-2xl">
                lock
              </span>
              <h2 className="text-2xl font-bold">Đổi mật khẩu</h2>
            </div>

            <form
              onSubmit={handlePasswordSubmit(onSubmitPassword)}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  {...registerPassword("currentPassword")}
                  className="w-full h-12 px-5 border border-gray-200 rounded-2xl focus:border-[#b51c00] focus:ring-1 focus:ring-[#b51c00] outline-none"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    {...registerPassword("newPassword")}
                    className="w-full h-12 px-5 border border-gray-200 rounded-2xl focus:border-[#b51c00] focus:ring-1 focus:ring-[#b51c00] outline-none"
                    placeholder="Nhập mật khẩu mới"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    {...registerPassword("confirmNewPassword")}
                    className="w-full h-12 px-5 border border-gray-200 rounded-2xl focus:border-[#b51c00] focus:ring-1 focus:ring-[#b51c00] outline-none"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  {passwordErrors.confirmNewPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {passwordErrors.confirmNewPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 border-2 border-[#b51c00] text-[#b51c00] font-bold text-lg rounded-2xl hover:bg-red-50 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAdminStaffStore } from "@/stores/useAdminStaffStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { useAdminRoleStore } from "@/stores/useAdminRoleStore";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";
import { hasPermission } from "@/lib/permissions";

const staffSchema = z.object({
  displayName: z.string().min(1, "Tên đầy đủ là bắt buộc"),
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  phone: z
    .string()
    .min(1, "Số điện thoại là bắt buộc")
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"),
  password: z
    .string()
    .min(1, "Mật khẩu là bắt buộc")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  roleId: z.string().min(1, "Vai trò là bắt buộc"),
  status: z.enum(["active", "inactive"]),
});

type StaffFormData = z.infer<typeof staffSchema>;

const StaffCreate = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuthStore();
  const { createStaff, loading } = useAdminStaffStore();
  const { roles, fetchRoles } = useAdminRoleStore();
  const [showPassword, setShowPassword] = useState(false);

  const canCreate = hasPermission(user, "staffs_create");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      displayName: "",
      email: "",
      phone: "",
      password: "",
      roleId: "",
      status: "active",
    },
  });

  useEffect(() => {
    fetchRoles("", 1, 100);
  }, [fetchRoles]);

  const onSubmit = async (data: StaffFormData) => {
    try {
      await createStaff(data);
      navigate("/admin/staffs");
    } catch (error: any) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    }
  };

  if (!canCreate) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý nhân viên", href: "/admin/staffs" },
          { label: "Thêm nhân viên", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      {/* HEADER BREADCRUMB */}
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý nhân viên", href: "/admin/staff" },
          { label: "Thêm nhân viên", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[900px] mx-auto space-y-6">
        <AdminPageHeading
          title="Thêm nhân viên mới"
          subtitle="Điền thông tin để tạo tài khoản nhân viên"
        />

        {/* FORM CARD */}
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[18px] font-bold text-gray-900">
              Thông tin nhân viên
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Display Name */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Tên đầy đủ <span className="text-red-500">*</span>
              </label>
              <input
                id="displayName"
                type="text"
                {...register("displayName")}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.displayName
                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-200 focus:ring-[#b51c00]/20 focus:border-[#b51c00]"
                }`}
                placeholder="Nhập tên đầy đủ"
              />
              {errors.displayName && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {errors.displayName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-200 focus:ring-[#b51c00]/20 focus:border-[#b51c00]"
                }`}
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="text"
                {...register("phone")}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.phone
                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-200 focus:ring-[#b51c00]/20 focus:border-[#b51c00]"
                }`}
                placeholder="0912345678"
              />
              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className={`w-full px-4 py-2.5 pr-11 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                      : "border-gray-200 focus:ring-[#b51c00]/20 focus:border-[#b51c00]"
                  }`}
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="roleId"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                id="roleId"
                {...register("roleId")}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                  errors.roleId
                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-200 focus:ring-[#b51c00]/20 focus:border-[#b51c00]"
                }`}
              >
                <option value="">-- Chọn vai trò --</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.title}
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {errors.roleId.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Trạng thái
              </label>
              <select
                id="status"
                {...register("status")}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] transition-all cursor-pointer"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Khóa</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate("/admin/staffs")}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#b51c00] text-white rounded-lg text-sm font-semibold hover:bg-[#8e1400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu nhân viên
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffCreate;

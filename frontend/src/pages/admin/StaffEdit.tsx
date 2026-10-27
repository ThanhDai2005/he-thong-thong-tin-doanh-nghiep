import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
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

const staffEditSchema = z.object({
  displayName: z.string().min(1, "Tên đầy đủ là bắt buộc"),
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  phone: z
    .string()
    .min(1, "Số điện thoại là bắt buộc")
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"),
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 6,
      "Mật khẩu phải có ít nhất 6 ký tự",
    ),
  roleId: z.string().min(1, "Vai trò là bắt buộc"),
  status: z.enum(["active", "inactive"]),
});

type StaffEditFormData = z.infer<typeof staffEditSchema>;

const StaffEdit = () => {
  const navigate = useNavigate();
  const { staffId } = useParams<{ staffId: string }>();
  const { user } = useAdminAuthStore();
  const { currentStaff, loading, getDetail, updateStaff } =
    useAdminStaffStore();
  const { roles, fetchRoles } = useAdminRoleStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);

  const canView = hasPermission(user, "staffs_view");
  const canEdit = hasPermission(user, "staffs_edit");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StaffEditFormData>({
    resolver: zodResolver(staffEditSchema),
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

  useEffect(() => {
    const fetchDetail = async () => {
      if (staffId) {
        try {
          setIsLoadingDetail(true);
          await getDetail(staffId);
        } catch (error) {
          toast.error("Không thể tải chi tiết nhân viên");
          navigate("/admin/staffs");
        } finally {
          setIsLoadingDetail(false);
        }
      }
    };

    fetchDetail();
  }, [staffId, getDetail, navigate]);

  useEffect(() => {
    if (currentStaff) {
      reset({
        displayName: currentStaff.displayName || "",
        email: currentStaff.email || "",
        phone: currentStaff.phone || "",
        password: "",
        roleId:
          typeof currentStaff.roleId === "object"
            ? currentStaff.roleId._id
            : "",
        status: currentStaff.status || "active",
      });
    }
  }, [currentStaff, reset]);

  const onSubmit = async (data: StaffEditFormData) => {
    if (!staffId) return;

    try {
      const updateData: {
        displayName: string;
        email: string;
        phone: string;
        password?: string;
        roleId: string;
        status: "active" | "inactive";
      } = {
        displayName: data.displayName,
        email: data.email,
        phone: data.phone,
        roleId: data.roleId,
        status: data.status,
      };

      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      await updateStaff(staffId, updateData);
      navigate("/admin/staffs");
    } catch (error: any) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    }
  };

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý nhân viên", href: "/admin/staffs" },
          { label: "Chỉnh sửa nhân viên", isCurrentPage: true },
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
          { label: "Quản lý nhân viên", href: "/admin/staffs" },
          {
            label: "Chỉnh sửa nhân viên",
            isCurrentPage: true,
          },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[900px] mx-auto space-y-6">
        <AdminPageHeading
          title={canEdit ? "Chỉnh sửa nhân viên" : "Xem chi tiết nhân viên"}
          subtitle="Cập nhật thông tin tài khoản nhân viên"
        />

        {/* LOADING SKELETON */}
        {isLoadingDetail ? (
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="p-6 space-y-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
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
                    disabled={!canEdit}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.displayName
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                        : "border-gray-200 focus:ring-[#b51c00]/20 focus:border-[#b51c00]"
                    } ${!canEdit ? "bg-gray-50 cursor-not-allowed" : ""}`}
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
                    disabled={!canEdit}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.email
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                        : "border-gray-200 focus:ring-[#b51c00]/20 focus:border-[#b51c00]"
                    } ${!canEdit ? "bg-gray-50 cursor-not-allowed" : ""}`}
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
                    disabled={!canEdit}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.phone
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                        : "border-gray-200 focus:ring-[#b51c00]/20 focus:border-[#b51c00]"
                    } ${!canEdit ? "bg-gray-50 cursor-not-allowed" : ""}`}
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
                {canEdit && (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Mật khẩu mới{" "}
                      <span className="text-gray-500 text-xs font-normal">
                        (để trống nếu không đổi)
                      </span>
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
                        placeholder="Nhập mật khẩu mới"
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
                )}

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
                    disabled={
                      !canEdit ||
                      (typeof currentStaff?.roleId === "object" &&
                        currentStaff?.roleId?.title === "Super Admin")
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                      errors.roleId
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                        : "border-gray-200 focus:ring-[#b51c00]/20 focus:border-[#b51c00]"
                    } ${
                      !canEdit ||
                      (typeof currentStaff?.roleId === "object" &&
                        currentStaff?.roleId?.title === "Super Admin")
                        ? "bg-gray-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <option value="">-- Chọn vai trò --</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.title}
                      </option>
                    ))}
                  </select>
                  {typeof currentStaff?.roleId === "object" &&
                    currentStaff?.roleId?.title === "Super Admin" && (
                      <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-amber-600 rounded-full"></span>
                        Không thể thay đổi vai trò Super Admin
                      </p>
                    )}
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
                    disabled={
                      !canEdit ||
                      (typeof currentStaff?.roleId === "object" &&
                        currentStaff?.roleId?.title === "Super Admin")
                    }
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] transition-all cursor-pointer ${
                      !canEdit ||
                      (typeof currentStaff?.roleId === "object" &&
                        currentStaff?.roleId?.title === "Super Admin")
                        ? "bg-gray-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Khóa</option>
                  </select>
                  {typeof currentStaff?.roleId === "object" &&
                    currentStaff?.roleId?.title === "Super Admin" && (
                      <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-amber-600 rounded-full"></span>
                        Không thể thay đổi trạng thái Super Admin
                      </p>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/staffs")}
                    className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    {canEdit ? "Hủy" : "Quay lại"}
                  </button>
                  {canEdit && (
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
                          Lưu thay đổi
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StaffEdit;

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAdminCustomerStore } from "@/stores/useAdminCustomerStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";
import { hasPermission } from "@/lib/permissions";

const customerEditSchema = z.object({
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
  address: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type CustomerEditFormData = z.infer<typeof customerEditSchema>;

const CustomerEdit = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const { user } = useAdminAuthStore();
  const { currentCustomer, loading, getDetail, updateCustomer } =
    useAdminCustomerStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);

  const canView = hasPermission(user, "customers_view");
  const canEdit = hasPermission(user, "customers_edit");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerEditFormData>({
    resolver: zodResolver(customerEditSchema),
    defaultValues: {
      displayName: "",
      email: "",
      phone: "",
      password: "",
      address: "",
      status: "active",
    },
  });

  useEffect(() => {
    const fetchDetail = async () => {
      if (customerId) {
        try {
          setIsLoadingDetail(true);
          await getDetail(customerId);
        } catch (error) {
          toast.error("Không thể tải chi tiết khách hàng");
          navigate("/admin/customers");
        } finally {
          setIsLoadingDetail(false);
        }
      }
    };

    fetchDetail();
  }, [customerId, getDetail, navigate]);

  useEffect(() => {
    if (currentCustomer) {
      reset({
        displayName: currentCustomer.displayName || "",
        email: currentCustomer.email || "",
        phone: currentCustomer.phone || "",
        password: "",
        address: currentCustomer.address || "",
        status: currentCustomer.status || "active",
      });
    }
  }, [currentCustomer, reset]);

  const onSubmit = async (data: CustomerEditFormData) => {
    if (!customerId) return;

    try {
      const updateData: {
        displayName: string;
        email: string;
        phone: string;
        password?: string;
        status: "active" | "inactive";
        address?: string;
      } = {
        displayName: data.displayName,
        email: data.email,
        phone: data.phone,
        status: data.status,
        address: data.address,
      };

      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      await updateCustomer(customerId, payload);
      navigate("/admin/customers");
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
          { label: "Quản lý khách hàng", href: "/admin/customers" },
          { label: "Chỉnh sửa khách hàng", isCurrentPage: true },
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
          { label: "Quản lý khách hàng", href: "/admin/customers" },
          {
            label: "Chỉnh sửa khách",
            isCurrentPage: true,
          },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[900px] mx-auto space-y-6">
        <AdminPageHeading
          title={"Chỉnh sửa khách hàng"}
          subtitle="Cập nhật thông tin tài khoản khách hàng"
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
                  Thông tin khách hàng
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
                      !canEdit
                        ? "bg-gray-50 cursor-not-allowed"
                        : errors.displayName
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
                    disabled={!canEdit}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                      !canEdit
                        ? "bg-gray-50 cursor-not-allowed"
                        : errors.email
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
                    disabled={!canEdit}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                      !canEdit
                        ? "bg-gray-50 cursor-not-allowed"
                        : errors.phone
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
                {canEdit && (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Mật khẩu mới{" "}
                      <span className="text-gray-500 text-xs font-normal">
                        (Để trống nếu không đổi)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
                        className={`w-full px-4 py-2.5 pr-12 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
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

                {/* Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Địa chỉ
                  </label>
                  <textarea
                    id="address"
                    {...register("address")}
                    disabled={!canEdit}
                    rows={3}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all resize-none ${
                      !canEdit
                        ? "bg-gray-50 cursor-not-allowed"
                        : "border-gray-200 focus:ring-[#b51c00]/20 focus:border-[#b51c00]"
                    }`}
                    placeholder="Nhập địa chỉ (không bắt buộc)"
                  />
                </div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Trạng thái <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    {...register("status")}
                    disabled={!canEdit}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                      !canEdit
                        ? "bg-gray-50 cursor-not-allowed"
                        : "border-gray-200 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white cursor-pointer"
                    }`}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Khóa</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/customers")}
                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {canEdit ? "Hủy" : "Quay lại"}
                  </button>
                  {canEdit && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#b51c00] rounded-lg hover:bg-[#8e1400] shadow-sm shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Lưu thay đổi</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* HELPER TEXT */}
            {canEdit && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      Lưu ý khi chỉnh sửa
                    </h3>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>
                        • Email và số điện thoại phải là duy nhất trong hệ thống
                      </li>
                      <li>
                        • Để trống mật khẩu nếu không muốn thay đổi mật khẩu
                        hiện tại
                      </li>
                      <li>• Nếu nhập mật khẩu mới, phải có ít nhất 6 ký tự</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerEdit;

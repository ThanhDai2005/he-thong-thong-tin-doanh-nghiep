import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { useAdminSupplierStore } from "@/stores/useAdminSupplierStore";
import { hasPermission } from "@/lib/permissions";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminFormActions from "@/components/admin/AdminFormActions";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const supplierEditSchema = z.object({
  name: z.string().min(1, "Tên nhà cung cấp không được để trống"),
  phone: z
    .string()
    .min(1, "Số điện thoại không được để trống")
    .regex(/^0[0-9]{9,10}$/, "Số điện thoại không hợp lệ (10-11 chữ số)"),
  email: z
    .string()
    .min(1, "Email không được để trống")
    .email("Email không đúng định dạng"),
  address: z.string().min(1, "Địa chỉ không được để trống"),
  taxCode: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type SupplierEditFormData = z.infer<typeof supplierEditSchema>;

const SupplierEdit = () => {
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const { user } = useAdminAuthStore();
  const { getSupplierDetail, updateSupplier, loading } =
    useAdminSupplierStore();
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(true);

  const canEdit = hasPermission(user, "suppliers_edit");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplierEditFormData>({
    resolver: zodResolver(supplierEditSchema),
  });

  useEffect(() => {
    const fetchSupplierDetail = async () => {
      if (!supplierId) return;
      try {
        setLoadingDetail(true);
        const supplier = await getSupplierDetail(supplierId);
        reset({
          name: supplier.name,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          taxCode: supplier.taxCode || "",
          status: supplier.status,
        });
      } catch (error) {
        console.error("Error fetching supplier detail:", error);
        toast.error("Không thể tải thông tin nhà cung cấp");
        navigate("/admin/suppliers");
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchSupplierDetail();
  }, [supplierId, getSupplierDetail, reset, navigate]);

  const onSubmit = async (data: SupplierEditFormData) => {
    if (!supplierId) return;

    try {
      setSubmitting(true);
      await updateSupplier(supplierId, {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
        address: data.address.trim(),
        taxCode: data.taxCode?.trim() || "",
        status: data.status,
      });
      toast.success("Cập nhật nhà cung cấp thành công");
      navigate("/admin/suppliers");
    } catch (error) {
      console.error("Error updating supplier:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDetail) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#b51c00]" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý nhà cung cấp", href: "/admin/suppliers" },
          { label: "Chỉnh sửa nhà cung cấp", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý nhà cung cấp", href: "/admin/suppliers" },
          { label: "Chỉnh sửa nhà cung cấp", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1000px] mx-auto space-y-6">
        <AdminPageHeading title="Chỉnh sửa nhà cung cấp" />

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 p-6 space-y-6">
            {/* Tên nhà cung cấp */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Tên nhà cung cấp <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                type="text"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent bg-white transition-shadow"
                placeholder="Nhập tên nhà cung cấp"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Số điện thoại + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("phone")}
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent bg-white transition-shadow"
                  placeholder="0123456789"
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent bg-white transition-shadow"
                  placeholder="example@company.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("address")}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent bg-white transition-shadow resize-none"
                placeholder="Nhập địa chỉ"
              />
              {errors.address && (
                <p className="text-xs text-red-500">{errors.address.message}</p>
              )}
            </div>

            {/* Mã số thuế */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Mã số thuế
              </label>
              <input
                {...register("taxCode")}
                type="text"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent bg-white transition-shadow"
                placeholder="Nhập mã số thuế (không bắt buộc)"
              />
              {errors.taxCode && (
                <p className="text-xs text-red-500">{errors.taxCode.message}</p>
              )}
            </div>

            {/* Trạng thái */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <select
                {...register("status")}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngưng hoạt động</option>
              </select>
              {errors.status && (
                <p className="text-xs text-red-500">{errors.status.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <AdminFormActions
              loading={submitting || loading}
              submitLabel="Cập nhật"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierEdit;

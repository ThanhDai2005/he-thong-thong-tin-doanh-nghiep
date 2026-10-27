import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRoleStore } from "@/stores/useAdminRoleStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminFormActions from "@/components/admin/AdminFormActions";

const RoleCreate = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuthStore();
  const { createRole, loading } = useAdminRoleStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const [errors, setErrors] = useState({
    title: "",
  });

  const canCreate = hasPermission(user, "roles_create");

  const validateForm = () => {
    const newErrors = {
      title: "",
    };

    if (!formData.title.trim()) {
      newErrors.title = "Tên vai trò không được để trống";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Tên vai trò phải có ít nhất 3 ký tự";
    }

    setErrors(newErrors);
    return !newErrors.title;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreate) {
      toast.error("Bạn không có quyền tạo vai trò");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      await createRole({
        title: formData.title.trim(),
        description: formData.description.trim(),
      });
      toast.success("Tạo vai trò thành công");
      navigate("/admin/roles");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Tạo vai trò thất bại");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  if (!canCreate) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý vai trò", href: "/admin/roles" },
          { label: "Thêm vai trò", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-6 flex flex-col">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý vai trò", href: "/admin/roles" },
          { label: "Thêm vai trò", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full space-y-6 flex-grow">
        <AdminPageHeading
          title="Thêm vai trò mới"
          subtitle="Tạo vai trò mới cho hệ thống. Bạn có thể gán quyền sau khi tạo xong."
          onBack={() => navigate("/admin/roles")}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 p-6 md:p-8">
            <h2 className="text-[18px] font-bold text-gray-900 mb-6">
              Thông tin vai trò
            </h2>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Tên vai trò <span className="text-[#b51c00]">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.title
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                      : "border-gray-200 focus:ring-[#b51c00]/20 focus:border-[#b51c00]"
                  }`}
                  placeholder="Nhập tên vai trò (vd: Nhân viên kho, Quản lý...)"
                  disabled={loading}
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Mô tả vai trò
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] transition-all resize-none"
                  placeholder="Mô tả vai trò này có trách nhiệm gì, phạm vi công việc..."
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Mô tả ngắn gọn về vai trò và trách nhiệm của vị trí này
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Lưu ý về phân quyền
                </h3>
                <p className="text-sm text-blue-800">
                  Sau khi tạo vai trò, bạn cần vào trang{" "}
                  <strong>Phân quyền</strong> để gán các quyền cụ thể cho vai
                  trò này. Vai trò mới sẽ không có quyền nào cho đến khi bạn cấu
                  hình.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <AdminFormActions loading={loading} submitLabel="Tạo vai trò" />
        </form>
      </div>
    </div>
  );
};

export default RoleCreate;

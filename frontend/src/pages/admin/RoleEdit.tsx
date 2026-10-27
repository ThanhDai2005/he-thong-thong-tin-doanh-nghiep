import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminRoleStore } from "@/stores/useAdminRoleStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminFormActions from "@/components/admin/AdminFormActions";

const RoleEdit = () => {
  const navigate = useNavigate();
  const { roleId } = useParams();
  const { user } = useAdminAuthStore();
  const { currentRole, loading, getRoleDetail, updateRole, clearCurrentRole } =
    useAdminRoleStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const [errors, setErrors] = useState({
    title: "",
  });

  const canEdit = hasPermission(user, "roles_edit");

  useEffect(() => {
    if (roleId && canEdit) {
      getRoleDetail(roleId);
    }

    return () => {
      clearCurrentRole();
    };
  }, [roleId, getRoleDetail, clearCurrentRole, canEdit]);

  useEffect(() => {
    if (currentRole) {
      setFormData({
        title: currentRole.title || "",
        description: currentRole.description || "",
      });
    }
  }, [currentRole]);

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

    if (!canEdit) {
      toast.error("Bạn không có quyền chỉnh sửa vai trò");
      return;
    }

    if (!roleId) {
      toast.error("Không tìm thấy ID vai trò");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      await updateRole(roleId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
      });
      toast.success("Cập nhật vai trò thành công");
      navigate("/admin/roles");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Cập nhật vai trò thất bại",
      );
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

  if (!canEdit) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý vai trò", href: "/admin/roles" },
          { label: "Chỉnh sửa vai trò", isCurrentPage: true },
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
          { label: "Chỉnh sửa vai trò", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full space-y-6 flex-grow">
        <AdminPageHeading
          title="Chỉnh sửa vai trò"
          subtitle="Cập nhật thông tin vai trò. Để thay đổi quyền, vui lòng sử dụng trang Phân quyền."
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

              {currentRole && currentRole.permissions && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Quyền hiện tại
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {currentRole.permissions.length} quyền
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentRole.permissions.slice(0, 8).map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {perm}
                      </span>
                    ))}
                    {currentRole.permissions.length > 8 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{currentRole.permissions.length - 8} quyền khác
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Để thay đổi quyền, vui lòng sử dụng trang{" "}
                    <a
                      href="/admin/permissions"
                      className="text-[#b51c00] hover:underline font-semibold"
                    >
                      Phân quyền
                    </a>
                  </p>
                </div>
              )}
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
                  Lưu ý
                </h3>
                <p className="text-sm text-blue-800">
                  Trang này chỉ cho phép chỉnh sửa tên và mô tả vai trò. Để thay
                  đổi các quyền được gán cho vai trò này, vui lòng sử dụng trang{" "}
                  <strong>Phân quyền</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <AdminFormActions loading={loading} submitLabel="Cập nhật vai trò" />
        </form>
      </div>
    </div>
  );
};

export default RoleEdit;

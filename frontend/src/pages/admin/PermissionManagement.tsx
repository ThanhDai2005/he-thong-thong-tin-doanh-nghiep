import { useState, useEffect } from "react";
import { useAdminRoleStore } from "@/stores/useAdminRoleStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { toast } from "sonner";
import { hasPermission } from "@/lib/permissions";
import AdminHeader from "@/components/admin/AdminHeader";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const PermissionManagement = () => {
  const { user } = useAdminAuthStore();
  const {
    roles,
    permissions,
    loading,
    fetchRoles,
    fetchPermissions,
    updatePermissions,
    getRoleDetail,
    currentRole,
  } = useAdminRoleStore();

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const canView = hasPermission(user, "roles_view");
  const canManagePermissions = hasPermission(user, "roles_permissions");

  useEffect(() => {
    if (canView) {
      fetchRoles();
      fetchPermissions();
    }
  }, [fetchRoles, fetchPermissions, canView]);

  useEffect(() => {
    if (selectedRoleId && canView) {
      getRoleDetail(selectedRoleId);
    }
  }, [selectedRoleId, getRoleDetail, canView]);

  useEffect(() => {
    if (currentRole && currentRole._id === selectedRoleId) {
      const rolePermissions = currentRole.permissions || [];

      // Nếu là SuperAdmin, tự động thêm tất cả quyền "view"
      if (currentRole.title === "Super Admin") {
        const allViewPermissions = permissions
          .filter((perm) => perm.value.includes("_view"))
          .map((perm) => perm.value);

        const mergedPermissions = Array.from(
          new Set([...rolePermissions, ...allViewPermissions]),
        );
        setSelectedPermissions(mergedPermissions);
      } else {
        setSelectedPermissions(rolePermissions);
      }
    }
  }, [currentRole, permissions]);

  const groupPermissions = () => {
    const grouped: Record<string, Array<{ value: string; label: string }>> = {};
    permissions.forEach((perm) => {
      if (!grouped[perm.group]) {
        grouped[perm.group] = [];
      }
      grouped[perm.group].push({ value: perm.value, label: perm.label });
    });
    return grouped;
  };

  const groupedPermissions = groupPermissions();

  const normalize = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .trim();
  };

  const filteredGroups = Object.keys(groupedPermissions).filter((group) => {
    const keyword = normalize(searchQuery);
    if (!keyword) return true;

    return normalize(group).includes(keyword);
  });

  const handleTogglePermission = (permissionId: string) => {
    // Nếu là SuperAdmin và permission là view, không cho bỏ chọn
    if (
      currentRole?.title === "Super Admin" &&
      permissionId.includes("_view")
    ) {
      return;
    }

    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const handleToggleGroup = (groupName: string, isChecked: boolean) => {
    const groupPermissionIds = groupedPermissions[groupName].map(
      (p) => p.value,
    );

    if (isChecked) {
      setSelectedPermissions((prev) => {
        const newSet = new Set([...prev, ...groupPermissionIds]);
        return Array.from(newSet);
      });
    } else {
      // Nếu là SuperAdmin, không cho bỏ chọn các quyền view
      if (currentRole?.title === "Super Admin") {
        const nonViewPermissions = groupPermissionIds.filter(
          (id) => !id.includes("_view"),
        );

        setSelectedPermissions((prev) =>
          prev.filter((id) => !nonViewPermissions.includes(id)),
        );
      } else {
        setSelectedPermissions((prev) =>
          prev.filter((id) => !groupPermissionIds.includes(id)),
        );
      }
    }
  };

  const isGroupFullySelected = (groupName: string) => {
    const groupPermissionIds = groupedPermissions[groupName].map(
      (p) => p.value,
    );
    return groupPermissionIds.every((id) => selectedPermissions.includes(id));
  };

  const handleApply = async () => {
    if (!canManagePermissions) {
      toast.error("Bạn không có quyền phân quyền");
      return;
    }

    if (!selectedRoleId) {
      toast.error("Vui lòng chọn vai trò");
      return;
    }

    try {
      await updatePermissions(selectedRoleId, selectedPermissions);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Cập nhật quyền thất bại");
    }
  };

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Phân quyền", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-6 flex flex-col">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Phân quyền", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-6 flex-grow">
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 p-6 md:p-8">
          <h1 className="text-[24px] font-bold text-gray-900 mb-6 tracking-tight">
            Thêm quyền vào vai trò
          </h1>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-gray-100 pb-8">
            <div className="flex flex-col gap-3 w-full md:w-[350px]">
              <select
                value={selectedRoleId}
                onChange={(e) => {
                  setSelectedPermissions([]);
                  setSelectedRoleId(e.target.value);
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white cursor-pointer font-medium text-gray-800 shadow-sm"
              >
                <option value="">Chọn vai trò...</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.title}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Tìm kiếm nhóm quyền ở đây..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white shadow-sm"
              />
            </div>

            <div className="w-full md:w-auto flex justify-end">
              <button
                onClick={handleApply}
                disabled={!canManagePermissions || !selectedRoleId || loading}
                className="px-8 py-2.5 bg-[#b51c00] text-white rounded-lg font-bold text-sm hover:bg-[#8e1400] shadow-sm shadow-red-500/20 transition-all active:scale-95 w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Đang xử lý..." : "Áp dụng"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-[20px] font-bold text-gray-900 text-center mb-8">
              Quản lý phân quyền
            </h2>

            {filteredGroups.length === 0 ? (
              <p className="text-center text-gray-500 py-10">
                Không tìm thấy nhóm quyền phù hợp.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                {filteredGroups.map((groupName) => (
                  <div key={groupName} className="flex flex-col gap-3">
                    <h3 className="text-[14px] font-bold text-gray-900 leading-snug h-10">
                      {groupName}
                    </h3>

                    <label className="flex items-center gap-2 cursor-pointer group/label">
                      <input
                        type="checkbox"
                        className="w-[18px] h-[18px] rounded-sm border-2 border-gray-300 cursor-pointer accent-blue-600 transition-all"
                        checked={isGroupFullySelected(groupName)}
                        onChange={(e) =>
                          handleToggleGroup(groupName, e.target.checked)
                        }
                      />
                      <span className="text-[14px] font-semibold text-gray-800 group-hover/label:text-[#b51c00] transition-colors select-none">
                        Chọn tất cả
                      </span>
                    </label>

                    <div className="flex flex-col gap-3 mt-1">
                      {groupedPermissions[groupName].map((perm) => {
                        const isViewPermission = perm.value.includes("_view");
                        const isSuperAdmin =
                          currentRole?.title === "Super Admin";
                        const isDisabled = isSuperAdmin && isViewPermission;

                        return (
                          <label
                            key={perm.value}
                            className={`flex items-start gap-2 ${
                              isDisabled
                                ? "cursor-not-allowed"
                                : "cursor-pointer"
                            } group/item`}
                          >
                            <input
                              type="checkbox"
                              className={`w-[18px] h-[18px] rounded-sm border-2 border-gray-300 transition-all mt-[1px] ${
                                isDisabled
                                  ? "cursor-not-allowed bg-gray-100"
                                  : "cursor-pointer accent-blue-600"
                              }`}
                              checked={selectedPermissions.includes(perm.value)}
                              onChange={() =>
                                handleTogglePermission(perm.value)
                              }
                              disabled={isDisabled}
                            />
                            <span
                              className={`text-[14px] font-medium transition-colors select-none leading-tight ${
                                isDisabled
                                  ? "text-gray-400"
                                  : "text-gray-600 group-hover/item:text-gray-900"
                              }`}
                            >
                              {perm.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;

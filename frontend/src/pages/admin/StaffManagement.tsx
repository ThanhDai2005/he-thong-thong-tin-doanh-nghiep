import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Search,
  Plus,
  Edit,
  Lock,
  RotateCcw,
  Trash2,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminStaffStore } from "@/stores/useAdminStaffStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { useAdminRoleStore } from "@/stores/useAdminRoleStore";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";
import { hasPermission } from "@/lib/permissions";
import {
  confirmDelete,
  confirmRestore,
  confirmPermanentDelete,
} from "@/lib/sweetalert";

const StaffManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("keyword") || "";
  const roleFilter = searchParams.get("roleId") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [localKeyword, setLocalKeyword] = useState(searchTerm);

  const { user } = useAdminAuthStore();
  const {
    staffs,
    totalPages,
    loading,
    fetchStaffs,
    changeStatus,
    changeMulti,
    deleteItem,
  } = useAdminStaffStore();
  const { roles, fetchRoles } = useAdminRoleStore();

  const showSkeleton = loading && staffs.length === 0;
  const showOverlay = loading && staffs.length > 0;

  const canView = hasPermission(user, "staffs_view");
  const canCreate = hasPermission(user, "staffs_create");
  const canEdit = hasPermission(user, "staffs_edit");
  const canDelete = hasPermission(user, "staffs_delete");

  const updateURL = (newParams: Record<string, string>) => {
    const params = Object.fromEntries(searchParams.entries());
    const mergedParams = { ...params, ...newParams };

    Object.keys(mergedParams).forEach((key) => {
      if (
        !mergedParams[key] ||
        (key === "page" && mergedParams[key] === "1") ||
        (key === "status" && mergedParams[key] === "all") ||
        (key === "roleId" && mergedParams[key] === "all") ||
        (key === "limit" && mergedParams[key] === "10") ||
        (key === "keyword" && mergedParams[key] === "")
      ) {
        delete mergedParams[key];
      }
    });
    setSearchParams(mergedParams);
  };

  useEffect(() => {
    setLocalKeyword(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localKeyword !== searchTerm) {
        updateURL({ keyword: localKeyword, page: "1" });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localKeyword]);

  const refetchStaffs = async () => {
    const roleId = roleFilter !== "all" ? roleFilter : "";
    const status = statusFilter !== "all" ? statusFilter : "";
    await fetchStaffs(searchTerm, roleId, status, currentPage, limit);
  };

  useEffect(() => {
    if (canView) {
      refetchStaffs();
    }
  }, [
    currentPage,
    limit,
    searchTerm,
    roleFilter,
    statusFilter,
    fetchStaffs,
    canView,
  ]);

  useEffect(() => {
    fetchRoles("", 1, 100);
  }, [fetchRoles]);

  const handleChangeStatus = async (
    staffId: string,
    status: "active" | "inactive",
  ) => {
    if (!canEdit) {
      toast.error("Bạn không có quyền chỉnh sửa nhân viên");
      return;
    }

    const result =
      status === "active"
        ? await confirmRestore(
            "Khôi phục nhân viên?",
            "Nhân viên sẽ được kích hoạt và có thể đăng nhập lại",
          )
        : await confirmDelete(
            "Khóa nhân viên?",
            "Nhân viên sẽ bị khóa và không thể đăng nhập",
          );

    if (!result.isConfirmed) return;

    try {
      await changeStatus(staffId, status);
      await refetchStaffs();
      // Find the staff's staffId to remove from selectedItems
      const staff = staffs.find((s) => s._id === staffId);
      if (staff) {
        setSelectedItems(selectedItems.filter((id) => id !== staff.staffId));
      }
    } catch (error: any) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    }
  };

  const handleDeleteItem = async (staffId: string) => {
    if (!canDelete) {
      toast.error("Bạn không có quyền xóa nhân viên");
      return;
    }

    const result = await confirmPermanentDelete(
      "Xóa vĩnh viễn?",
      "Hành động này không thể hoàn tác! Nhân viên sẽ bị xóa vĩnh viễn khỏi hệ thống.",
    );

    if (!result.isConfirmed) return;

    try {
      await deleteItem(staffId);
      await refetchStaffs();
      // Find the staff's staffId to remove from selectedItems
      const staff = staffs.find((s) => s._id === staffId);
      if (staff) {
        setSelectedItems(selectedItems.filter((id) => id !== staff.staffId));
      }
    } catch (error: any) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    }
  };

  const handleBulkAction = async (
    type: "active" | "inactive" | "delete-all",
  ) => {
    if (selectedItems.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một nhân viên");
      return;
    }

    if ((type === "active" || type === "inactive") && !canEdit) {
      toast.error("Bạn không có quyền chỉnh sửa nhân viên");
      return;
    }

    if (type === "delete-all" && !canDelete) {
      toast.error("Bạn không có quyền xóa nhân viên");
      return;
    }

    let result;
    if (type === "active") {
      result = await confirmRestore(
        "Khôi phục nhiều nhân viên?",
        `Bạn đang khôi phục ${selectedItems.length} nhân viên`,
      );
    } else if (type === "inactive") {
      result = await confirmDelete(
        "Khóa nhiều nhân viên?",
        `Bạn đang khóa ${selectedItems.length} nhân viên`,
      );
    } else {
      result = await confirmPermanentDelete(
        "Xóa vĩnh viễn nhiều nhân viên?",
        `Bạn đang xóa vĩnh viễn ${selectedItems.length} nhân viên. Hành động này không thể hoàn tác!`,
      );
    }

    if (!result.isConfirmed) return;

    try {
      await changeMulti(selectedItems, type);
      await refetchStaffs();
      setSelectedItems([]);
    } catch (error) {
      // Error already handled in store
    }
  };

  const selectedStaffs = staffs.filter((s) =>
    selectedItems.includes(s.staffId),
  );
  const hasActiveSelected = selectedStaffs.some((s) => s.status === "active");
  const hasInactiveSelected = selectedStaffs.some(
    (s) => s.status === "inactive",
  );

  const isSuperAdmin = (staff) => {
    return staff?.roleId && staff?.roleId?.title === "Super Admin";
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Exclude Super Admin staffs from bulk selection
      const selectableStaffs = staffs.filter((item) => !isSuperAdmin(item));
      setSelectedItems(selectableStaffs.map((item) => item.staffId));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (staffId: string) => {
    if (selectedItems.includes(staffId)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== staffId));
    } else {
      setSelectedItems([...selectedItems, staffId]);
    }
  };

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý nhân viên", isCurrentPage: true },
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
          { label: "Quản lý nhân viên", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* TITLE & FILTERS */}
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 mb-6 tracking-tight">
            Quản lý nhân viên
          </h1>

          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            {/* Left: Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tên, email, SĐT..."
                  value={localKeyword}
                  onChange={(e) => setLocalKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white transition-shadow"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) =>
                  updateURL({ roleId: e.target.value, page: "1" })
                }
                className="w-full sm:w-48 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white cursor-pointer"
              >
                <option value="all">Tất cả vai trò</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.title}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  updateURL({ status: e.target.value, page: "1" })
                }
                className="w-full sm:w-48 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Khóa</option>
              </select>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              {canEdit && hasInactiveSelected && (
                <button
                  onClick={() => handleBulkAction("active")}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#ffc1cc] text-[#c2185b] rounded-[20px] font-semibold text-sm hover:bg-[#ffadc0] transition-colors active:scale-95 whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4" />
                  Mở khóa đã chọn
                </button>
              )}

              {canEdit && hasActiveSelected && (
                <button
                  onClick={() => handleBulkAction("inactive")}
                  disabled={selectedItems.length === 0}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#ffdad6] text-[#ba1a1a] rounded-[20px] font-semibold text-sm hover:bg-[#ffb4a5] transition-colors active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  Khóa đã chọn
                </button>
              )}

              {canDelete && hasInactiveSelected && (
                <button
                  onClick={() => handleBulkAction("delete-all")}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#fee2e2] text-[#991b1b] rounded-[20px] font-semibold text-sm hover:bg-[#fecaca] transition-colors active:scale-95 whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa vĩnh viễn đã chọn
                </button>
              )}

              {canCreate && (
                <button
                  onClick={() => navigate("/admin/staff/create")}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#b51c00] text-white rounded-[20px] font-semibold text-sm hover:bg-[#8e1400] shadow-sm shadow-red-500/20 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Thêm nhân viên
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DATA TABLE SECTION */}
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[18px] font-bold text-gray-900">Danh sách</h2>
          </div>

          <div className="relative">
            {showOverlay && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-lg shadow-lg border border-gray-200">
                  <div className="w-5 h-5 border-2 border-[#b51c00] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600 font-medium">
                    Đang tải...
                  </span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[12px] text-gray-500 bg-[#f1f5f9] uppercase font-bold border-b border-gray-200 tracking-wider">
                  <tr>
                    <th scope="col" className="p-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                          onChange={handleSelectAll}
                          checked={
                            selectedItems.length === staffs.length &&
                            staffs.length > 0
                          }
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 ">
                      STT
                    </th>
                    <th scope="col" className="px-6 py-4 text-center ">
                      Ảnh đại diện
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Tên đầy đủ
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      SĐT
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Vai trò
                    </th>
                    <th scope="col" className="px-6 py-4 text-center ">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-4 text-center ">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {showSkeleton ? (
                    Array.from({ length: limit }).map((_, index) => (
                      <tr
                        key={index}
                        className="animate-pulse bg-white border-b border-gray-50"
                      >
                        <td className="p-4">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-8 "></div>
                        </td>
                        <td className="px-6 py-4 flex justify-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-40"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-6 bg-gray-200 rounded-md w-20 mx-auto"></div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-6 bg-gray-200 rounded-md w-20 mx-auto"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            <div className="h-7 bg-gray-200 rounded w-16"></div>
                            <div className="h-7 bg-gray-200 rounded w-16"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : staffs.length > 0 ? (
                    staffs.map((item, index) => {
                      const isSuperAdminUser = isSuperAdmin(item);
                      return (
                        <tr
                          key={item._id}
                          className="bg-white border-b border-gray-50 hover:bg-[#f8fafc] transition-colors group"
                        >
                          <td className="p-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                checked={selectedItems.includes(item.staffId)}
                                onChange={() => handleSelectItem(item.staffId)}
                                disabled={isSuperAdminUser}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {(currentPage - 1) * limit + index + 1}
                          </td>
                          <td className="px-6 py-4 flex justify-center">
                            {item.avatarUrl ? (
                              <img
                                src={item.avatarUrl}
                                alt={item.displayName}
                                className="w-12 h-12 rounded-full object-cover border border-gray-100 bg-gray-50 shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b51c00] to-[#8e1400] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {item.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">
                              {item.displayName}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-600">{item.email}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-gray-600">{item.phone}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#e0e7ff] text-[#4338ca]">
                              {item.roleId?.title || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {item.status === "active" ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#d1fae5] text-[#15803d]">
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#fee2e2] text-[#b91c1c]">
                                Khóa
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 justify-center">
                              {isSuperAdminUser ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-[6px]">
                                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                                  <span className="text-xs font-bold text-amber-700">
                                    Protected
                                  </span>
                                </div>
                              ) : item.status === "active" ? (
                                <>
                                  {canEdit && (
                                    <button
                                      onClick={() =>
                                        navigate(
                                          `/admin/staff/edit/${item.staffId}`,
                                        )
                                      }
                                      className="px-3 py-1.5 border border-[#22c55e] text-[#16a34a] rounded-[6px] text-xs font-bold hover:bg-[#f0fdf4] transition-colors flex items-center gap-1"
                                    >
                                      <Edit className="w-3 h-3" />
                                      Sửa
                                    </button>
                                  )}
                                  {canEdit && (
                                    <button
                                      onClick={() =>
                                        handleChangeStatus(
                                          item.staffId!,
                                          "inactive",
                                        )
                                      }
                                      className="px-3 py-1.5 border border-[#ef4444] text-[#dc2626] rounded-[6px] text-xs font-bold hover:bg-[#fef2f2] transition-colors flex items-center gap-1"
                                    >
                                      <Lock className="w-3 h-3" />
                                      Khóa
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  {canEdit && (
                                    <button
                                      onClick={() =>
                                        handleChangeStatus(
                                          item.staffId!,
                                          "active",
                                        )
                                      }
                                      className="px-3 py-1.5 border border-[#ec4899] text-[#db2777] rounded-[6px] text-xs font-bold hover:bg-[#fdf2f8] transition-colors flex items-center gap-1"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      Mở khóa
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      onClick={() =>
                                        handleDeleteItem(item.staffId!)
                                      }
                                      className="px-3 py-1.5 border border-[#ef4444] text-[#dc2626] rounded-[6px] text-xs font-bold hover:bg-[#fef2f2] transition-colors flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Xóa vĩnh viễn
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserCog className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">
                            Không tìm thấy nhân viên nào
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
          {!showSkeleton && staffs.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100">
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                limit={limit}
                onPageChange={(page) => updateURL({ page: String(page) })}
                onLimitChange={(newLimit) =>
                  updateURL({ limit: String(newLimit), page: "1" })
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;

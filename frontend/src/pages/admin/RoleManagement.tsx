import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Loader2, Plus, Search } from "lucide-react";
import { useAdminRoleStore } from "@/stores/useAdminRoleStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { confirmPermanentDelete } from "@/lib/sweetalert";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const RoleManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("keyword") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const [localKeyword, setLocalKeyword] = useState(searchTerm);

  const { user } = useAdminAuthStore();
  const { roles, loading, totalPages, fetchRoles, deleteRole } =
    useAdminRoleStore();

  const showSkeleton = loading && roles.length === 0;
  const showOverlay = loading && roles.length > 0;

  const canView = hasPermission(user, "roles_view");
  const canCreate = hasPermission(user, "roles_create");
  const canEdit = hasPermission(user, "roles_edit");
  const canDelete = hasPermission(user, "roles_delete");

  const updateURL = (newParams: Record<string, string>) => {
    const params = Object.fromEntries(searchParams.entries());
    const mergedParams = { ...params, ...newParams };

    Object.keys(mergedParams).forEach((key) => {
      if (
        !mergedParams[key] ||
        (key === "page" && mergedParams[key] === "1") ||
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

  // Debounce: dừng gõ 300ms mới đẩy lên URL → useEffect cũ tự fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localKeyword !== searchTerm) {
        updateURL({ keyword: localKeyword, page: "1" });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localKeyword]);

  useEffect(() => {
    if (canView) {
      fetchRoles(searchTerm, currentPage, limit);
    }
  }, [searchTerm, currentPage, limit, fetchRoles, canView]);

  const handleDelete = async (roleId: string) => {
    if (!canDelete) {
      toast.error("Bạn không có quyền xóa vai trò");
      return;
    }

    const result = await confirmPermanentDelete(
      "Xóa vĩnh viễn?",
      "Hành động này không thể hoàn tác! Vai trò sẽ bị xóa vĩnh viễn khỏi hệ thống.",
    );

    if (!result.isConfirmed) return;

    try {
      await deleteRole(roleId);
      fetchRoles(searchTerm, currentPage, limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xóa vai trò thất bại");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý vai trò", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-6 flex flex-col">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý vai trò", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-6 flex-grow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
              Quản lý vai trò
            </h1>
          </div>

          {canCreate && (
            <div className="flex w-full sm:w-auto">
              <button
                onClick={() => navigate("/admin/role/create")}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#b51c00] text-white rounded-[20px] font-semibold text-sm hover:bg-[#8e1400] shadow-sm shadow-red-500/20 transition-all active:scale-95 whitespace-nowrap w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Thêm vai trò
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden flex flex-col mt-4">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-[18px] font-bold text-gray-900">
              Danh sách vai trò
            </h2>

            <div className="relative w-full sm:w-[350px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm vai trò ở đây..."
                value={localKeyword}
                onChange={(e) => setLocalKeyword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white transition-shadow"
              />
            </div>
          </div>

          <div className="relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[12px] text-gray-500 bg-[#f1f5f9] uppercase font-bold border-b border-gray-200 tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-center">
                      STT
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Tên vai trò
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Mô tả
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Ngày tạo
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {showSkeleton ? (
                    // Skeleton rows on first load
                    Array.from({ length: limit }).map((_, index) => (
                      <tr
                        key={index}
                        className="animate-pulse bg-white border-b border-gray-50"
                      >
                        <td className="px-6 py-5">
                          <div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-2 justify-center">
                            <div className="h-7 bg-gray-200 rounded w-16"></div>
                            <div className="h-7 bg-gray-200 rounded w-16"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : roles.length > 0 ? (
                    roles.map((item, index) => (
                      <tr
                        key={item._id}
                        className="bg-white border-b border-gray-50 hover:bg-[#f8fafc] transition-colors group align-middle"
                      >
                        <td className="px-6 py-5 font-bold text-gray-900 text-center">
                          {(currentPage - 1) * limit + index + 1}
                        </td>
                        <td className="px-6 py-5 font-bold text-gray-900 text-center">
                          {item.title}
                        </td>
                        <td className="px-6 py-5 text-gray-600 text-center font-medium max-w-md">
                          {item.description ? (
                            item.description
                          ) : (
                            <span className="text-gray-400 italic">
                              Không có mô tả
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-gray-600 font-medium text-center whitespace-nowrap">
                          <span className="inline-block text-left">
                            Ngày tạo: {formatDate(item.createdAt)}
                            <br />
                            Ngày cập nhật: {formatDate(item.updatedAt)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            {canEdit && (
                              <button
                                onClick={() =>
                                  navigate(`/admin/role/edit/${item._id}`)
                                }
                                className="px-3 py-1.5 border border-[#22c55e] text-[#16a34a] rounded-[6px] text-[13px] font-bold hover:bg-[#f0fdf4] transition-colors whitespace-nowrap"
                              >
                                Sửa
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(item._id)}
                                className="px-3 py-1.5 border border-[#ef4444] text-[#dc2626] rounded-[6px] text-[13px] font-bold hover:bg-[#fef2f2] transition-colors whitespace-nowrap"
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        Không tìm thấy vai trò nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Overlay spinner for subsequent loads */}
            {showOverlay && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-[#b51c00]" />
                  <span className="text-sm font-semibold text-gray-600">
                    Đang tải...
                  </span>
                </div>
              </div>
            )}
          </div>

          {roles.length > 0 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              limit={limit}
              onPageChange={(page) => updateURL({ page: page.toString() })}
              onLimitChange={(newLimit) =>
                updateURL({ limit: newLimit.toString(), page: "1" })
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  PauseCircle,
  RotateCcw,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { useAdminSupplierStore } from "@/stores/useAdminSupplierStore";
import { hasPermission } from "@/lib/permissions";
import {
  confirmDelete,
  confirmRestore,
  confirmPermanentDelete,
} from "@/lib/sweetalert";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const SupplierManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("keyword") || "";
  const statusFilter = searchParams.get("status") || "all";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [localKeyword, setLocalKeyword] = useState(searchTerm);

  const { user } = useAdminAuthStore();
  const {
    suppliers,
    totalPages,
    totalItems,
    loading,
    fetchSuppliers,
    changeStatus,
    changeMulti,
    deleteItem,
  } = useAdminSupplierStore();

  const showSkeleton = loading && suppliers.length === 0;
  const showOverlay = loading && suppliers.length > 0;

  const canView = hasPermission(user, "suppliers_view");
  const canCreate = hasPermission(user, "suppliers_create");
  const canEdit = hasPermission(user, "suppliers_edit");
  const canDelete = hasPermission(user, "suppliers_delete");

  const updateURL = (newParams: Record<string, string>) => {
    const params = Object.fromEntries(searchParams.entries());
    const mergedParams = { ...params, ...newParams };
    Object.keys(mergedParams).forEach((key) => {
      if (
        !mergedParams[key] ||
        (key === "page" && mergedParams[key] === "1") ||
        (key === "status" && mergedParams[key] === "all") ||
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

  const refetchSuppliers = async () => {
    const status = statusFilter !== "all" ? statusFilter : "";
    await fetchSuppliers(searchTerm, status, currentPage, limit);
  };

  useEffect(() => {
    if (canView) {
      refetchSuppliers();
    }
  }, [currentPage, limit, searchTerm, statusFilter, fetchSuppliers, canView]);

  const handleChangeStatus = async (
    supplierId: string,
    status: "active" | "inactive",
  ) => {
    if (!canEdit) {
      toast.error("Bạn không có quyền chỉnh sửa nhà cung cấp");
      return;
    }

    const result =
      status === "active"
        ? await confirmRestore(
            "Kích hoạt nhà cung cấp?",
            "Nhà cung cấp sẽ được chuyển về trạng thái hoạt động",
          )
        : await confirmDelete(
            "Ngưng hoạt động?",
            "Nhà cung cấp sẽ chuyển sang trạng thái ngưng hoạt động",
          );

    if (!result.isConfirmed) return;

    try {
      await changeStatus(supplierId, status);
      await refetchSuppliers();
      setSelectedItems(selectedItems.filter((id) => id !== supplierId));
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleDeleteItem = async (supplierId: string) => {
    if (!canDelete) {
      toast.error("Bạn không có quyền xóa nhà cung cấp");
      return;
    }

    const result = await confirmPermanentDelete(
      "Xóa vĩnh viễn?",
      "Hành động này không thể hoàn tác! Nhà cung cấp sẽ bị xóa khỏi hệ thống.",
    );

    if (!result.isConfirmed) return;

    try {
      await deleteItem(supplierId);
      await refetchSuppliers();
      setSelectedItems(selectedItems.filter((id) => id !== supplierId));
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleBulkAction = async (
    type: "active" | "inactive" | "delete-all",
  ) => {
    if (selectedItems.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một nhà cung cấp");
      return;
    }

    if (type === "delete-all" && !canDelete) {
      toast.error("Bạn không có quyền xóa nhà cung cấp");
      return;
    }

    if ((type === "active" || type === "inactive") && !canEdit) {
      toast.error("Bạn không có quyền chỉnh sửa nhà cung cấp");
      return;
    }

    let result;
    if (type === "active") {
      result = await confirmRestore(
        "Kích hoạt nhiều nhà cung cấp?",
        `Bạn đang kích hoạt ${selectedItems.length} nhà cung cấp`,
      );
    } else if (type === "inactive") {
      result = await confirmDelete(
        "Ngưng hoạt động nhiều nhà cung cấp?",
        `Bạn đang ngưng hoạt động ${selectedItems.length} nhà cung cấp`,
      );
    } else {
      result = await confirmPermanentDelete(
        "Xóa vĩnh viễn nhiều nhà cung cấp?",
        `Bạn đang xóa vĩnh viễn ${selectedItems.length} nhà cung cấp. Hành động này không thể hoàn tác!`,
      );
    }

    if (!result.isConfirmed) return;

    try {
      await changeMulti(selectedItems, type);
      await refetchSuppliers();
      setSelectedItems([]);
    } catch (error) {
      // Error already handled in store
    }
  };

  const selectedSuppliers = suppliers.filter((s) =>
    selectedItems.includes(s._id),
  );
  const hasActiveSelected = selectedSuppliers.some(
    (s) => s.status === "active",
  );
  const hasInactiveSelected = selectedSuppliers.some(
    (s) => s.status === "inactive",
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(suppliers.map((item) => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý nhà cung cấp", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      {/* HEADER */}
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý nhà cung cấp", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* PAGE TITLE + STATS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
              Quản lý nhà cung cấp
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Tổng cộng{" "}
              <span className="font-semibold text-[#b51c00]">{totalItems}</span>{" "}
              nhà cung cấp
            </p>
          </div>
        </div>

        {/* FILTERS + ACTIONS */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          {/* Left: Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tên, email, SĐT, mã số thuế..."
                value={localKeyword}
                onChange={(e) => setLocalKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/30 focus:border-[#b51c00] bg-white transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => updateURL({ status: e.target.value, page: "1" })}
              className="w-full sm:w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/30 focus:border-[#b51c00] bg-white cursor-pointer transition-all"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngưng hoạt động</option>
            </select>
          </div>

          {/* Right: Bulk + Create */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {canEdit && hasInactiveSelected && (
              <button
                onClick={() => handleBulkAction("active")}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#ffc1cc] text-[#c2185b] rounded-[20px] font-semibold text-sm hover:bg-[#ffadc0] transition-colors active:scale-95 whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                Kích hoạt đã chọn
              </button>
            )}

            {canEdit && hasActiveSelected && (
              <button
                onClick={() => handleBulkAction("inactive")}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#ffdad6] text-[#ba1a1a] rounded-[20px] font-semibold text-sm hover:bg-[#ffb4a5] transition-colors active:scale-95 whitespace-nowrap"
              >
                <PauseCircle className="w-4 h-4" />
                Ngưng đã chọn
              </button>
            )}

            {canDelete && hasInactiveSelected && (
              <button
                onClick={() => handleBulkAction("delete-all")}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#fee2e2] text-[#991b1b] rounded-[20px] font-semibold text-sm hover:bg-[#fecaca] transition-colors active:scale-95 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                Xóa đã chọn
              </button>
            )}

            {canCreate && (
              <button
                onClick={() => navigate("/admin/supplier/create")}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#b51c00] text-white rounded-[20px] font-semibold text-sm hover:bg-[#8e1400] shadow-sm shadow-red-500/20 transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Thêm nhà cung cấp
              </button>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-gray-900">
              Danh sách nhà cung cấp
            </h2>
            {selectedItems.length > 0 && (
              <span className="text-sm text-[#b51c00] font-semibold bg-red-50 px-3 py-1 rounded-full">
                Đã chọn {selectedItems.length}
              </span>
            )}
          </div>

          <div className="relative">
            {/* Loading overlay when refetching */}
            {showOverlay && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-b-[12px]">
                <div className="w-7 h-7 border-2 border-[#b51c00] border-t-transparent rounded-full animate-spin" />
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
                            selectedItems.length === suppliers.length &&
                            suppliers.length > 0
                          }
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-4">
                      STT
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Tên nhà cung cấp
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Liên hệ
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Địa chỉ
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Mã số thuế
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
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
                          <div className="w-4 h-4 bg-gray-200 rounded" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 bg-gray-200 rounded w-6" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-36" />
                            <div className="h-3 bg-gray-100 rounded w-28" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-28" />
                            <div className="h-3 bg-gray-100 rounded w-36" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-40" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24 mx-auto" />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-6 bg-gray-200 rounded-full w-20 mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            <div className="h-7 bg-gray-200 rounded w-14" />
                            <div className="h-7 bg-gray-200 rounded w-14" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : suppliers.length > 0 ? (
                    suppliers.map((item, index) => (
                      <tr
                        key={item._id}
                        className="bg-white border-b border-gray-50 hover:bg-[#f8fafc] transition-colors group"
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            className="w-4 h-4 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                            checked={selectedItems.includes(item._id)}
                            onChange={() => handleSelectItem(item._id)}
                          />
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-500 text-center">
                          {(currentPage - 1) * limit + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b51c00]/10 to-[#b51c00]/5 flex items-center justify-center flex-shrink-0 border border-[#b51c00]/10">
                              <Building2 className="w-5 h-5 text-[#b51c00]" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 leading-tight">
                                {item.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-sm font-medium">
                                {item.phone}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs">{item.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-1.5 max-w-[200px]">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600 line-clamp-2">
                              {item.address}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.taxCode ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm font-mono text-gray-700">
                                {item.taxCode}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.status === "active" ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#d1fae5] text-[#15803d]">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#fee2e2] text-[#b91c1c]">
                              Ngưng hoạt động
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {item.status === "active" ? (
                              <>
                                {canEdit && (
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/admin/supplier/edit/${item._id}`,
                                      )
                                    }
                                    className="px-3 py-1.5 border border-[#22c55e] text-[#16a34a] rounded-[6px] text-xs font-bold hover:bg-[#f0fdf4] transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    Sửa
                                  </button>
                                )}
                                {canEdit && (
                                  <button
                                    onClick={() =>
                                      handleChangeStatus(item._id, "inactive")
                                    }
                                    className="px-3 py-1.5 border border-[#ef4444] text-[#dc2626] rounded-[6px] text-xs font-bold hover:bg-[#fef2f2] transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <PauseCircle className="w-3 h-3" />
                                    Ngưng
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                {canEdit && (
                                  <button
                                    onClick={() =>
                                      handleChangeStatus(item._id, "active")
                                    }
                                    className="px-3 py-1.5 border border-[#22c55e] text-[#16a34a] rounded-[6px] text-xs font-bold hover:bg-[#f0fdf4] transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Kích hoạt
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteItem(item._id)}
                                    className="px-3 py-1.5 border border-[#dc2626] text-[#dc2626] rounded-[6px] text-xs font-bold hover:bg-[#fef2f2] transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Xóa
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-gray-300" />
                          </div>
                          <p className="text-gray-500 font-medium">
                            Không tìm thấy nhà cung cấp nào
                          </p>
                          <p className="text-gray-400 text-sm">
                            Thử thay đổi bộ lọc hoặc thêm nhà cung cấp mới
                          </p>
                          {canCreate && (
                            <button
                              onClick={() => navigate("/admin/supplier/create")}
                              className="mt-2 flex items-center gap-2 px-4 py-2 bg-[#b51c00] text-white rounded-lg text-sm font-semibold hover:bg-[#8e1400] transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              Thêm nhà cung cấp
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
          {suppliers.length > 0 && (
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

export default SupplierManagement;

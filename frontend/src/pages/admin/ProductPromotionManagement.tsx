import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Search,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  RotateCcw,
  PauseCircle,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminProductPromotionStore } from "@/stores/useAdminProductPromotionStore";
import { toast } from "sonner";
import {
  confirmDelete,
  confirmRestore,
  confirmPermanentDelete,
} from "@/lib/sweetalert";
import { hasPermission } from "@/lib/permissions";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const ProductPromotionManagement = () => {
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
    productPromotions,
    totalPages,
    loading,
    fetchProductPromotions,
    changeStatus,
    changeMulti,
    deleteItem,
  } = useAdminProductPromotionStore();

  const showSkeleton = loading && productPromotions.length === 0;
  const showOverlay = loading && productPromotions.length > 0;

  const canView = hasPermission(user, "product_promotions_view");
  const canCreate = hasPermission(user, "product_promotions_create");
  const canEdit = hasPermission(user, "product_promotions_edit");
  const canDelete = hasPermission(user, "product_promotions_delete");

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

  const refetchPromotions = async () => {
    const status = statusFilter !== "all" ? statusFilter : "";
    await fetchProductPromotions(searchTerm, status, currentPage, limit);
  };

  useEffect(() => {
    if (canView) {
      refetchPromotions();
    }
  }, [
    currentPage,
    limit,
    searchTerm,
    statusFilter,
    fetchProductPromotions,
    canView,
  ]);

  const handleChangeStatus = async (
    productPromotionId: string,
    status: "active" | "inactive",
  ) => {
    if (!canEdit) {
      toast.error("Bạn không có quyền chỉnh sửa khuyến mãi");
      return;
    }

    const result =
      status === "active"
        ? await confirmRestore(
            "Khôi phục khuyến mãi?",
            "Khuyến mãi sẽ được chuyển về trạng thái hoạt động",
          )
        : await confirmDelete(
            "Ngưng áp dụng khuyến mãi?",
            "Khuyến mãi sẽ chuyển sang trạng thái ngưng áp dụng",
          );

    if (!result.isConfirmed) return;

    try {
      await changeStatus(productPromotionId, status);
      await refetchPromotions();
      setSelectedItems((prev) =>
        prev.filter((id) => id !== productPromotionId),
      );
    } catch {
      // handled in store
    }
  };

  const handleDeleteItem = async (productPromotionId: string) => {
    if (!canDelete) {
      toast.error("Bạn không có quyền xóa khuyến mãi");
      return;
    }

    const result = await confirmPermanentDelete(
      "Xóa vĩnh viễn?",
      "Hành động này không thể hoàn tác! Khuyến mãi sẽ bị xóa vĩnh viễn khỏi hệ thống.",
    );

    if (!result.isConfirmed) return;

    try {
      await deleteItem(productPromotionId);
      await refetchPromotions();
      setSelectedItems((prev) =>
        prev.filter((id) => id !== productPromotionId),
      );
    } catch {
      // handled in store
    }
  };

  const handleBulkAction = async (
    type: "active" | "inactive" | "delete-all",
  ) => {
    if (selectedItems.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một khuyến mãi");
      return;
    }

    if (type === "delete-all" && !canDelete) {
      toast.error("Bạn không có quyền xóa khuyến mãi");
      return;
    }
    if ((type === "active" || type === "inactive") && !canEdit) {
      toast.error("Bạn không có quyền chỉnh sửa khuyến mãi");
      return;
    }

    let result;
    if (type === "active") {
      result = await confirmRestore(
        "Khôi phục nhiều khuyến mãi?",
        `Bạn đang khôi phục ${selectedItems.length} khuyến mãi`,
      );
    } else if (type === "inactive") {
      result = await confirmDelete(
        "Ngưng áp dụng nhiều khuyến mãi?",
        `Bạn đang ngưng áp dụng ${selectedItems.length} khuyến mãi`,
      );
    } else {
      result = await confirmPermanentDelete(
        "Xóa vĩnh viễn nhiều khuyến mãi?",
        `Bạn đang xóa vĩnh viễn ${selectedItems.length} khuyến mãi. Hành động này không thể hoàn tác!`,
      );
    }

    if (!result.isConfirmed) return;

    try {
      await changeMulti(selectedItems, type);
      await refetchPromotions();
      setSelectedItems([]);
    } catch {
      // handled in store
    }
  };

  const selectedRows = productPromotions.filter((item) =>
    selectedItems.includes(item._id),
  );
  const hasActiveSelected = selectedRows.some(
    (item) => item.promotionId?.status === "active",
  );
  const hasInactiveSelected = selectedRows.some(
    (item) => item.promotionId?.status === "inactive",
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(productPromotions.map((item) => item._id));
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("vi-VN"),
      time: d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const formatDiscount = (promotion: {
    discountType: string;
    discountValue: number;
  }) => {
    if (promotion.discountType === "percentage") {
      return `${promotion.discountValue}%`;
    }
    return formatCurrency(promotion.discountValue);
  };

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý khuyến mãi sản phẩm", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý khuyến mãi sản phẩm", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* TITLE & FILTERS */}
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 mb-6 tracking-tight">
            Quản lý khuyến mãi sản phẩm
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
                  placeholder="Tìm mã, tiêu đề..."
                  value={localKeyword}
                  onChange={(e) => setLocalKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white transition-shadow"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  updateURL({ status: e.target.value, page: "1" })
                }
                className="w-full sm:w-48 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngưng hoạt động</option>
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
                  Khôi phục đã chọn
                </button>
              )}

              {canEdit && hasActiveSelected && (
                <button
                  onClick={() => handleBulkAction("inactive")}
                  disabled={selectedItems.length === 0}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#ffdad6] text-[#ba1a1a] rounded-[20px] font-semibold text-sm hover:bg-[#ffb4a5] transition-colors active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PauseCircle className="w-4 h-4" />
                  Ngưng áp dụng đã chọn
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
                  onClick={() => navigate("/admin/product-promotion/create")}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#b51c00] text-white rounded-[20px] font-semibold text-sm hover:bg-[#8e1400] shadow-sm shadow-red-500/20 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Thêm khuyến mãi
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[18px] font-bold text-gray-900">Danh sách</h2>
          </div>

          <div className="relative">
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
                            selectedItems.length === productPromotions.length &&
                            productPromotions.length > 0
                          }
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-4 text-center">
                      STT
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Tên / Mã
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-center leading-tight"
                    >
                      Giảm
                      <br />
                      giá
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-center leading-tight"
                    >
                      Sản phẩm
                      <br />
                      áp dụng
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-center leading-tight"
                    >
                      Số lần
                      <br />
                      dùng
                    </th>
                    <th scope="col" className="px-4 py-4 text-center">
                      Trạng thái
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-center leading-tight"
                    >
                      Ngày bắt
                      <br />
                      đầu
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-center leading-tight"
                    >
                      Ngày kết
                      <br />
                      thúc
                    </th>
                    <th scope="col" className="px-4 py-4 text-center">
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
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-8 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
                        </td>
                        <td className="px-4 py-5 text-center">
                          <div className="h-6 bg-gray-200 rounded-md w-20 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex gap-2 justify-center">
                            <div className="h-7 bg-gray-200 rounded w-16" />
                            <div className="h-7 bg-gray-200 rounded w-16" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : productPromotions.length > 0 ? (
                    productPromotions.map((item, index) => {
                      const promotion = item.promotionId;
                      if (!promotion) return null;

                      const start = formatDateTime(promotion.startDate);
                      const end = formatDateTime(promotion.endDate);
                      const isPercentage =
                        promotion.discountType === "percentage";
                      const isActive = promotion.status === "active";
                      const now = new Date();
                      const isExpired = now > new Date(promotion.endDate);
                      const isUpcoming = now < new Date(promotion.startDate);

                      return (
                        <tr
                          key={item._id}
                          className="bg-white border-b border-gray-50 hover:bg-[#f8fafc] transition-colors group"
                        >
                          <td className="p-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                                checked={selectedItems.includes(item._id)}
                                onChange={() => handleSelectItem(item._id)}
                              />
                            </div>
                          </td>

                          <td className="px-4 py-5 font-bold text-gray-900 text-center">
                            {(currentPage - 1) * limit + index + 1}
                          </td>

                          <td className="px-4 py-5">
                            <div className="font-semibold text-gray-900">
                              {promotion.title}
                            </div>
                            <code className="text-[12px] font-bold text-[#92400e] bg-[#fef3c7] px-1.5 py-0.5 rounded border border-[#fde68a]">
                              {promotion.code}
                            </code>
                            {isExpired && (
                              <div className="text-[11px] text-red-600 font-medium mt-0.5">
                                Đã hết hạn
                              </div>
                            )}
                            {isUpcoming && !isExpired && (
                              <div className="text-[11px] text-blue-600 font-medium mt-0.5">
                                Sắp diễn ra
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-5 text-center">
                            <span
                              className={`inline-flex items-center justify-center px-2 py-1 rounded-[4px] text-[12px] font-bold text-white min-w-[36px] ${
                                isPercentage ? "bg-[#22c55e]" : "bg-[#3b82f6]"
                              }`}
                            >
                              {formatDiscount(promotion)}
                            </span>
                            {isPercentage && promotion.maxDiscountAmount ? (
                              <div className="text-[11px] text-gray-400 mt-1">
                                Tối đa{" "}
                                {formatCurrency(promotion.maxDiscountAmount)}
                              </div>
                            ) : null}
                          </td>

                          <td className="px-4 py-5 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-bold text-[#3b82f6]">
                              <Package className="w-4 h-4" />
                              {item.productIds?.length || 0}
                            </div>
                          </td>

                          <td className="px-4 py-5 font-bold text-gray-700 text-center">
                            {promotion.usedCount ?? 0}
                            {promotion.usageLimit != null && (
                              <span className="text-gray-400 font-medium">
                                {" "}
                                / {promotion.usageLimit}
                              </span>
                            )}
                            {promotion.usageLimit == null && (
                              <span className="text-gray-400 font-medium">
                                {" "}
                                / ∞
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-5 text-center">
                            {isActive ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#d1fae5] text-[#15803d]">
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#fee2e2] text-[#b91c1c]">
                                Ngưng hoạt động
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-5 text-gray-500 font-medium text-center ">
                            {start.date}
                            <br />
                            {start.time}
                          </td>

                          <td className="px-4 py-5 text-gray-500 font-medium text-center ">
                            {end.date}
                            <br />
                            {end.time}
                          </td>

                          <td className="px-4 py-5">
                            <div className="flex items-center justify-center gap-2">
                              {isActive ? (
                                <>
                                  {canEdit && (
                                    <button
                                      onClick={() =>
                                        navigate(
                                          `/admin/product-promotion/edit/${item._id}`,
                                        )
                                      }
                                      className="px-3 py-1.5 border border-[#22c55e] text-[#16a34a] rounded-[6px] text-xs font-bold hover:bg-[#f0fdf4] transition-colors flex items-center gap-1"
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
                                      className="px-3 py-1.5 border border-[#ef4444] text-[#dc2626] rounded-[6px] text-xs font-bold hover:bg-[#fef2f2] transition-colors flex items-center gap-1"
                                    >
                                      <PauseCircle className="w-3 h-3" />
                                      Ngưng áp dụng
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
                                      className="px-3 py-1.5 border border-[#ec4899] text-[#db2777] rounded-[6px] text-xs font-bold hover:bg-[#fdf2f8] transition-colors flex items-center gap-1"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      Khôi phục
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteItem(item._id)}
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
                      <td
                        colSpan={10}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        Không tìm thấy khuyến mãi sản phẩm nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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

          {productPromotions.length > 0 && (
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

export default ProductPromotionManagement;

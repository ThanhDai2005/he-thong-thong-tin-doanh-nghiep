import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Loader2,
  Package,
  Calendar,
  TrendingUp,
  Clock,
  Ban,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { useAdminStockReceiptStore } from "@/stores/useAdminStockReceiptStore";
import { useAdminSupplierStore } from "@/stores/useAdminSupplierStore";
import { hasPermission } from "@/lib/permissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Status badge config ───────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: "Chờ xác nhận",
    bg: "bg-[#fef3c7]",
    text: "text-[#92400e]",
    border: "border-[#fcd34d]",
    dot: "bg-amber-500",
    icon: Clock,
  },
  completed: {
    label: "Hoàn thành",
    bg: "bg-[#d1fae5]",
    text: "text-[#15803d]",
    border: "border-[#86efac]",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Đã hủy",
    bg: "bg-[#fee2e2]",
    text: "text-[#b91c1c]",
    border: "border-[#fca5a5]",
    dot: "bg-red-500",
    icon: Ban,
  },
};

const StockReceiptManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get("keyword") || "";
  const statusFilter = searchParams.get("status") || "all";
  const supplierFilter = searchParams.get("supplierId") || "all";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const [localKeyword, setLocalKeyword] = useState(keyword);

  // Modals for Quick Action
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { user } = useAdminAuthStore();
  const {
    receipts,
    totalPages,
    totalItems,
    loading,
    fetchReceipts,
    confirmReceipt,
    cancelReceipt,
  } = useAdminStockReceiptStore();
  const { suppliers, fetchSuppliers } = useAdminSupplierStore();

  const canView = hasPermission(user, "stock_receipts_view");
  const canCreate = hasPermission(user, "stock_receipts_create");
  const canEdit = hasPermission(user, "stock_receipts_edit");

  const showSkeleton = loading && receipts.length === 0;
  const showOverlay = loading && receipts.length > 0;

  const updateURL = (newParams: Record<string, string>) => {
    const params = Object.fromEntries(searchParams.entries());
    const mergedParams = { ...params, ...newParams };
    Object.keys(mergedParams).forEach((key) => {
      if (
        !mergedParams[key] ||
        (key === "page" && mergedParams[key] === "1") ||
        (key === "limit" && mergedParams[key] === "10") ||
        (key === "status" && mergedParams[key] === "all") ||
        (key === "supplierId" && mergedParams[key] === "all") ||
        (key === "keyword" && mergedParams[key] === "") ||
        (key === "startDate" && mergedParams[key] === "") ||
        (key === "endDate" && mergedParams[key] === "")
      ) {
        delete mergedParams[key];
      }
    });
    setSearchParams(mergedParams);
  };

  useEffect(() => {
    setLocalKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localKeyword !== keyword) {
        updateURL({ keyword: localKeyword, page: "1" });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [localKeyword]);

  const refetchReceipts = async () => {
    const sFilter = statusFilter !== "all" ? statusFilter : "";
    const supFilter = supplierFilter !== "all" ? supplierFilter : "";
    await fetchReceipts(
      keyword,
      sFilter,
      supFilter,
      startDate,
      endDate,
      currentPage,
      limit,
    );
  };

  useEffect(() => {
    if (canView) {
      refetchReceipts();
    }
  }, [
    keyword,
    statusFilter,
    supplierFilter,
    startDate,
    endDate,
    currentPage,
    limit,
    fetchReceipts,
    canView,
  ]);

  useEffect(() => {
    fetchSuppliers("", "active", 1, 200);
  }, []);

  const handleClearFilters = () => {
    setLocalKeyword("");
    updateURL({
      keyword: "",
      status: "all",
      supplierId: "all",
      startDate: "",
      endDate: "",
      page: "1",
    });
  };

  const handleConfirm = async () => {
    if (!confirmId) return;
    try {
      setActionLoading(true);
      await confirmReceipt(confirmId);
      setConfirmId(null);
      await refetchReceipts();
    } catch {
      // handled in store
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      setActionLoading(true);
      await cancelReceipt(cancelId);
      setCancelId(null);
      await refetchReceipts();
    } catch {
      // handled in store
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";

  const pendingCount = receipts.filter((r) => r.status === "pending").length;
  const completedCount = receipts.filter(
    (r) => r.status === "completed",
  ).length;

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Phiếu nhập hàng", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Phiếu nhập hàng", isCurrentPage: true },
        ]}
      />

      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Quản lý phiếu nhập hàng
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Tổng cộng{" "}
              <span className="font-bold text-gray-900">{totalItems}</span>{" "}
              phiếu
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => navigate("/admin/stock-receipt/create")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#b51c00] text-white text-sm font-semibold rounded-[20px] hover:bg-[#8e1400] transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tạo phiếu nhập
            </button>
          )}
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Tổng phiếu nhập",
              value: totalItems,
              icon: ClipboardList,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
            },
            {
              label: "Chờ xác nhận",
              value: pendingCount,
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Hoàn thành",
              value: completedCount,
              icon: TrendingUp,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-[12px] border border-gray-200 p-5 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
            >
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── FILTER PANEL ── */}
        <div className="bg-white rounded-[12px] shadow-sm border border-gray-200 p-5 lg:p-6 space-y-4">
          {/* Row 1: Search & Dropdowns */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative w-full lg:w-96 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo ID phiếu nhập..."
                value={localKeyword}
                onChange={(e) => setLocalKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] outline-none transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <select
                value={statusFilter}
                onChange={(e) =>
                  updateURL({ status: e.target.value, page: "1" })
                }
                className="w-full sm:w-48 px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#b51c00] cursor-pointer"
              >
                <option value="all">Mọi trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>

              <select
                value={supplierFilter}
                onChange={(e) =>
                  updateURL({ supplierId: e.target.value, page: "1" })
                }
                className="w-full flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#b51c00] cursor-pointer"
              >
                <option value="all">Mọi nhà cung cấp</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Dates & Clear Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="whitespace-nowrap">Từ ngày:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    updateURL({ startDate: e.target.value, page: "1" })
                  }
                  className="px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[#b51c00] w-full sm:w-auto"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <span className="whitespace-nowrap">Đến ngày:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) =>
                    updateURL({ endDate: e.target.value, page: "1" })
                  }
                  className="px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[#b51c00] w-full sm:w-auto"
                />
              </div>
            </div>

            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-bold text-[#b51c00] bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap w-full sm:w-auto"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white rounded-[12px] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[18px] font-bold text-gray-900">
              Danh sách phiếu nhập
            </h2>
          </div>

          <div className="relative w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[12px] text-gray-500 bg-gray-50 uppercase font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-4 ">Mã phiếu</th>
                  <th className="px-4 py-4">Nhà cung cấp</th>
                  <th className="px-4 py-4  text-right ">Tổng tiền</th>
                  <th className="px-4 py-4 text-center ">Mặt hàng</th>
                  <th className="px-4 py-4  ">Người tạo</th>
                  <th className="px-4 py-4  ">Ngày tạo</th>
                  <th className="px-4 py-4  text-center">Trạng thái</th>
                  <th className="px-4 py-4  text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {showSkeleton ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <tr key={i} className="animate-pulse bg-white">
                      <td className="px-4 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="h-6 bg-gray-200 rounded-md w-8 mx-auto"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="h-7 bg-gray-200 rounded-md w-24 mx-auto"></div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="h-8 bg-gray-200 rounded-lg w-20 mx-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : receipts.length > 0 ? (
                  receipts.map((receipt) => {
                    const cfg =
                      STATUS_CONFIG[receipt.status] || STATUS_CONFIG.pending;
                    return (
                      <tr
                        key={receipt._id}
                        className="bg-white hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4 align-top">
                          <span className="font-mono font-bold text-[#b51c00] text-[13px] tracking-wide">
                            #{receipt._id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="font-semibold text-gray-900 leading-snug break-words">
                            {receipt.supplierId?.name || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-right font-bold text-gray-900 ">
                          {formatMoney(receipt.totalAmount)}
                        </td>
                        <td className="px-4 py-4 align-top text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                            {receipt.items.length}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="text-gray-700 font-medium overflow-hidden text-ellipsis max-w-[120px]">
                            {receipt.createdBy?.userId?.displayName || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-gray-500 font-medium">
                          {formatDate(receipt.createdAt)}
                        </td>
                        <td className="px-4 py-4 align-top text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold ${cfg.bg} ${cfg.text}`}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() =>
                                navigate(`/admin/stock-receipt/${receipt._id}`)
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Nút thao tác nhanh (Chỉ hiện khi chưa hoàn thành) */}
                            {canEdit && receipt.status === "pending" && (
                              <>
                                <button
                                  onClick={() => setConfirmId(receipt._id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                                  title="Xác nhận phiếu"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setCancelId(receipt._id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                                  title="Hủy phiếu"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Package className="w-12 h-12 text-gray-200" />
                        <p className="font-semibold text-gray-500">
                          Không tìm thấy phiếu nhập nào phù hợp với bộ lọc
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Overlay Loading */}
            {showOverlay && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-b-[12px]">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-[#b51c00]" />
                  <span className="text-sm font-semibold text-gray-600">
                    Đang tải...
                  </span>
                </div>
              </div>
            )}
          </div>

          {receipts.length > 0 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              limit={limit}
              onPageChange={(p) => updateURL({ page: p.toString() })}
              onLimitChange={(l) =>
                updateURL({ limit: l.toString(), page: "1" })
              }
            />
          )}
        </div>
      </div>

      {/* ═══════════════ ALERT DIALOG XÁC NHẬN ═══════════════ */}
      <AlertDialog open={!!confirmId} onOpenChange={setConfirmId}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <AlertDialogTitle className="text-lg font-bold text-gray-900">
                  Xác nhận phiếu nhập
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-gray-500 mt-0.5">
                  Hành động này sẽ cộng số lượng vào kho
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 my-4">
            <p className="text-sm text-emerald-800 font-medium">
              ✅ Sau khi xác nhận, số lượng tồn kho của các sản phẩm trong phiếu
              sẽ được tự động cập nhật và không thể hoàn tác.
            </p>
          </div>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel
              disabled={actionLoading}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={actionLoading}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Xác nhận phiếu"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════ ALERT DIALOG HỦY ═══════════════ */}
      <AlertDialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-left">
                <AlertDialogTitle className="text-lg font-bold text-gray-900">
                  Hủy phiếu nhập
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-gray-500 mt-0.5">
                  Phiếu sẽ bị hủy và không thể khôi phục
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 my-4">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Hành động này không thể hoàn tác. Phiếu nhập sẽ chuyển sang
              trạng thái "Đã hủy".
            </p>
          </div>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel
              disabled={actionLoading}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Quay lại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={actionLoading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Xác nhận hủy"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StockReceiptManagement;

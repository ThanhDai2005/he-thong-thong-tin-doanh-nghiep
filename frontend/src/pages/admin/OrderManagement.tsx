import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { Search, Loader2, Calendar } from "lucide-react";
import { useAdminOrderStore } from "@/stores/useAdminOrderStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { toast } from "sonner";
import { hasPermission } from "@/lib/permissions";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";
import OrderDetailDrawer from "@/components/admin/OrderDetailDrawer";

const OrderManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("keyword") || "";
  const orderStatusFilter = searchParams.get("orderStatus") || "all";
  const paymentStatusFilter = searchParams.get("paymentStatus") || "all";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [localKeyword, setLocalKeyword] = useState(searchTerm);

  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);
  const [pinnedOrderId, setPinnedOrderId] = useState<string | null>(null);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinnedRef = useRef<string | null>(null);

  useEffect(() => {
    pinnedRef.current = pinnedOrderId;
  }, [pinnedOrderId]);

  const { user } = useAdminAuthStore();
  const {
    orders,
    totalPages,
    totalItems,
    loading,
    fetchOrders,
    updateOrderStatus,
  } = useAdminOrderStore();

  const showSkeleton = loading && orders.length === 0;
  const showOverlay = loading && orders.length > 0;
  const canView = hasPermission(user, "orders_view");
  const canEdit = hasPermission(user, "orders_edit");

  const clearTimers = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Chỉ mở / đổi order — KHÔNG đóng ở đây
  const handleRowEnter = (orderId: string) => {
    clearTimers();
    // Đã ghim đơn khác → hover không đổi
    if (pinnedRef.current && pinnedRef.current !== orderId) return;

    openTimerRef.current = setTimeout(() => {
      setDrawerOrderId(orderId);
    }, 180);
  };

  // Rời CẢ khối (bảng + panel) mới đóng
  const handleMasterLeave = () => {
    if (pinnedRef.current) return;
    clearTimers();
    closeTimerRef.current = setTimeout(() => {
      if (!pinnedRef.current) setDrawerOrderId(null);
    }, 280);
  };

  const handleMasterEnter = () => {
    clearTimers();
  };

  const handleRowClick = (orderId: string) => {
    clearTimers();
    if (pinnedOrderId === orderId) {
      setPinnedOrderId(null);
      setDrawerOrderId(orderId);
    } else {
      setPinnedOrderId(orderId);
      setDrawerOrderId(orderId);
    }
  };

  const handleCloseDrawer = () => {
    clearTimers();
    setPinnedOrderId(null);
    setDrawerOrderId(null);
  };

  const updateURL = (newParams: Record<string, string>) => {
    const params = Object.fromEntries(searchParams.entries());
    const mergedParams = { ...params, ...newParams };

    Object.keys(mergedParams).forEach((key) => {
      if (
        !mergedParams[key] ||
        (key === "page" && mergedParams[key] === "1") ||
        (key === "orderStatus" && mergedParams[key] === "all") ||
        (key === "paymentStatus" && mergedParams[key] === "all") ||
        (key === "limit" && mergedParams[key] === "10") ||
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

  const refetchOrders = async () => {
    const filters: Record<string, string> = {};
    if (orderStatusFilter !== "all") filters.orderStatus = orderStatusFilter;
    if (paymentStatusFilter !== "all")
      filters.paymentStatus = paymentStatusFilter;
    if (searchTerm) filters.search = searchTerm;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    await fetchOrders(currentPage, limit, filters);
  };

  useEffect(() => {
    if (canView) {
      refetchOrders();
    }
  }, [
    currentPage,
    limit,
    searchTerm,
    orderStatusFilter,
    paymentStatusFilter,
    startDate,
    endDate,
    fetchOrders,
    canView,
  ]);

  const handleClearFilters = () => {
    updateURL({
      keyword: "",
      orderStatus: "all",
      paymentStatus: "all",
      startDate: "",
      endDate: "",
      page: "1",
    });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ================= CẤU HÌNH TRẠNG THÁI =================
  const orderStatusConfig = {
    Pending: {
      bg: "bg-[#fef3c7]",
      text: "text-[#92400e]",
      border: "border-[#fcd34d]",
      label: "Chờ xử lý",
      next: ["Processing", "Cancelled"],
    },
    Processing: {
      bg: "bg-[#dbeafe]",
      text: "text-[#1e40af]",
      border: "border-[#bfdbfe]",
      label: "Đang xử lý",
      next: ["Shipped", "Cancelled"],
    },
    Shipped: {
      bg: "bg-[#f3e8ff]",
      text: "text-[#4338ca]",
      border: "border-[#e9d5ff]",
      label: "Đang giao",
      next: ["Delivered"],
    },
    Delivered: {
      bg: "bg-[#d1fae5]",
      text: "text-[#15803d]",
      border: "border-[#86efac]",
      label: "Đã giao",
      next: [],
    },
    Cancelled: {
      bg: "bg-[#fee2e2]",
      text: "text-[#b91c1c]",
      border: "border-[#fca5a5]",
      label: "Đã hủy",
      next: [],
    },
  };

  // ================= PAYMENT BADGE =================
  const getPaymentBadge = (status: string, method: string) => {
    const isPaid = status === "Paid";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold ${isPaid ? "bg-[#d1fae5] text-[#15803d]" : "bg-[#fef3c7] text-[#92400e]"
          }`}
      >
        {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}{" "}
        <span className="ml-1 opacity-70">({method})</span>
      </span>
    );
  };

  // ================= STATUS UPDATE HANDLER =================
  const handleQuickStatusUpdate = async (
    orderId: string,
    newStatus: string,
    currentStatus: string,
  ) => {
    if (newStatus === currentStatus) {
      return;
    }

    if (!canEdit) {
      toast.error("Bạn không có quyền chỉnh sửa đơn hàng");
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatus(orderId, { orderStatus: newStatus });

      refetchOrders();
    } catch (error) {
      // Error handled in store
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý đơn hàng", isCurrentPage: true },
        ]}
      />
    );
  }

  const panelOpen = Boolean(drawerOrderId);

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý đơn hàng", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
            Quản lý đơn hàng
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Tổng số:{" "}
            <span className="font-bold text-gray-900">{totalItems}</span> đơn
          </p>

          {/* ================= BỘ LỌC ================= */}
          <div className="bg-white rounded-[12px] shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex flex-col xl:flex-row gap-4">
              <div className="relative w-full xl:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Mã đơn, SĐT hoặc Tên khách..."
                  value={localKeyword}
                  onChange={(e) => setLocalKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] outline-none"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) =>
                  updateURL({ orderStatus: e.target.value, page: "1" })
                }
                className="w-full xl:w-48 px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#b51c00] cursor-pointer"
              >
                <option value="all">Mọi trạng thái đơn</option>
                <option value="Pending">Chờ xử lý</option>
                <option value="Processing">Đang xử lý</option>
                <option value="Shipped">Đang giao</option>
                <option value="Delivered">Đã giao</option>
                <option value="Cancelled">Đã hủy</option>
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) =>
                  updateURL({ paymentStatus: e.target.value, page: "1" })
                }
                className="w-full xl:w-48 px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#b51c00] cursor-pointer"
              >
                <option value="all">Mọi TT thanh toán</option>
                <option value="Pending">Chưa thanh toán</option>
                <option value="Paid">Đã thanh toán</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Từ ngày:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    updateURL({ startDate: e.target.value, page: "1" })
                  }
                  className="px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[#b51c00]"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <span>Đến ngày:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) =>
                    updateURL({ endDate: e.target.value, page: "1" })
                  }
                  className="px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[#b51c00]"
                />
              </div>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-1.5 text-sm font-bold text-[#b51c00] bg-red-50 hover:bg-red-100 rounded-md transition-colors ml-auto"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* MASTER: bảng + panel — leave CHỈ gắn ở đây */}
        <div
          className="flex gap-4 items-start"
          onMouseEnter={handleMasterEnter}
          onMouseLeave={handleMasterLeave}
        >
          <div
            className={`bg-white rounded-[12px] shadow-sm border border-gray-200 overflow-hidden min-w-0 transition-all duration-200 ${panelOpen ? "flex-1" : "w-full"
              }`}
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-[18px] font-bold text-gray-900">
                Danh sách đơn hàng
              </h2>
            </div>

            <div className="w-full relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 bg-gray-50 uppercase font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-4 whitespace-nowrap">Mã đơn</th>
                    <th className="px-4 py-4">Khách hàng</th>
                    {!panelOpen && <th className="px-4 py-4">Thanh toán</th>}
                    <th className="px-4 py-4">Tổng tiền</th>
                    {!panelOpen && (
                      <th className="px-4 py-4 hidden lg:table-cell">
                        Người cập nhật
                      </th>
                    )}
                    <th className="px-4 py-4 whitespace-nowrap">Ngày đặt</th>
                    <th className="px-4 py-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {showSkeleton ? (
                    Array.from({ length: limit }).map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td colSpan={panelOpen ? 5 : 7} className="px-4 py-4">
                          <div className="h-4 bg-gray-200 rounded w-full" />
                        </td>
                      </tr>
                    ))
                  ) : orders.length > 0 ? (
                    orders.map((order) => {
                      const statusConfig = orderStatusConfig[order.orderStatus];
                      if (!statusConfig) return null;
                      const isUpdating = updatingOrderId === order._id;
                      const isEndState = statusConfig.next.length === 0;
                      const isActive = drawerOrderId === order._id;

                      return (
                        <tr
                          key={order._id}
                          className={`transition-colors cursor-pointer ${isActive
                            ? "bg-[#fef2f2] ring-1 ring-inset ring-[#b51c00]/20"
                            : "bg-white hover:bg-gray-50"
                            }`}
                          onMouseEnter={() => handleRowEnter(order._id)}
                          onClick={() => handleRowClick(order._id)}
                        >
                          <td className="px-4 py-3 font-mono text-[#b51c00] font-semibold whitespace-nowrap">
                            #{order._id.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {order.shippingAddress?.recipient}
                          </td>
                          {!panelOpen && (
                            <td className="px-4 py-3">
                              {getPaymentBadge(
                                order.paymentStatus,
                                order.paymentMethod,
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                            {order.totalAmount.toLocaleString("vi-VN")}₫
                          </td>
                          {!panelOpen && (
                            <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                              {order.updatedBy?.userId?.displayName || "—"}
                            </td>
                          )}
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </td>
                          <td
                            className="px-4 py-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isUpdating ? (
                              <div className="flex items-center justify-center">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                              </div>
                            ) : canEdit ? (
                              <select
                                value={order.orderStatus}
                                onChange={(e) =>
                                  handleQuickStatusUpdate(
                                    order._id,
                                    e.target.value,
                                    order.orderStatus,
                                  )
                                }
                                disabled={isEndState}
                                className={`w-full min-w-[110px] px-2 py-1.5 rounded-md border text-xs font-bold outline-none ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} ${isEndState
                                  ? "opacity-75 cursor-not-allowed"
                                  : "cursor-pointer"
                                  }`}
                              >
                                <option value={order.orderStatus}>
                                  {statusConfig.label}
                                </option>
                                {statusConfig.next.map((n) => (
                                  <option key={n} value={n}>
                                    {orderStatusConfig[n].label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                className={`inline-flex px-2 py-1 rounded-md border text-xs font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                              >
                                {statusConfig.label}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={panelOpen ? 5 : 7}
                        className="px-6 py-16 text-center text-gray-500"
                      >
                        Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {showOverlay && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                  <Loader2 className="w-7 h-7 animate-spin text-[#b51c00]" />
                </div>
              )}
            </div>

            {orders.length > 0 && (
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

          {panelOpen && drawerOrderId && (
            <div className="w-[380px] xl:w-[400px] shrink-0 sticky top-4 self-start">
              <OrderDetailDrawer
                orderId={drawerOrderId}
                isPinned={pinnedOrderId === drawerOrderId}
                onClose={handleCloseDrawer}
                onUpdated={refetchOrders}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;

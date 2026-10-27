import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Search, Eye, Loader2, Calendar } from "lucide-react";
import { useAdminOrderStore } from "@/stores/useAdminOrderStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { hasPermission } from "@/lib/permissions";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const OrderManagement = () => {
  const navigate = useNavigate();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
    const bg = isPaid ? "bg-[#d1fae5]" : "bg-[#fef3c7]";
    const text = isPaid ? "text-[#15803d]" : "text-[#92400e]";
    const label = isPaid ? "Đã thanh toán" : "Chưa thanh toán";

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold ${bg} ${text}`}
      >
        {label} <span className="ml-1 opacity-70">({method})</span>
      </span>
    );
  };

  // ================= STATUS UPDATE HANDLER =================
  const handleQuickStatusUpdate = async (
    orderId: string,
    newStatus: string,
    currentStatus: string,
  ) => {
    // Nếu chọn lại trạng thái hiện tại, không làm gì
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
                onClick={handleClearFilters}
                className="px-4 py-1.5 text-sm font-bold text-[#b51c00] bg-red-50 hover:bg-red-100 rounded-md transition-colors ml-auto"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* ================= BẢNG DỮ LIỆU ================= */}
        <div className="bg-white rounded-[12px] shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[18px] font-bold text-gray-900">
              Danh sách đơn hàng
            </h2>
          </div>

          <div className="w-full relative">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 bg-gray-50 uppercase font-bold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Mã đơn</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Thanh toán (Phương thức)</th>
                  <th className="px-6 py-4">Tổng tiền</th>
                  <th className="px-6 py-4">Người cập nhật</th>
                  <th className="px-6 py-4">Ngày đặt</th>
                  <th className="px-6 py-4 text-center">Trạng thái đơn</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {showSkeleton ? (
                  // Skeleton rows on first load
                  Array.from({ length: limit }).map((_, index) => (
                    <tr key={index} className="animate-pulse bg-white">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-gray-200 rounded-md w-36"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="h-7 bg-gray-200 rounded-md w-full"></div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="h-8 bg-gray-200 rounded-lg w-8 mx-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order) => {
                    const statusConfig = orderStatusConfig[order.orderStatus];

                    if (!statusConfig) {
                      return null;
                    }

                    const isUpdating = updatingOrderId === order._id;
                    const isEndState = statusConfig.next.length === 0;

                    return (
                      <tr
                        key={order._id}
                        className="bg-white hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-[#b51c00] font-semibold">
                          #{order._id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {order.shippingAddress.recipient}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getPaymentBadge(
                            order.paymentStatus,
                            order.paymentMethod,
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {order.totalAmount.toLocaleString("vi-VN")}₫
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          {order.updatedBy?.userId?.displayName || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {isUpdating ? (
                            <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-xs py-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Đang lưu...
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
                              className={`w-full px-3 py-1.5 rounded-md border text-xs font-bold transition-all outline-none
                                  ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
                                  ${
                                    isEndState
                                      ? "opacity-75 cursor-not-allowed"
                                      : "cursor-pointer hover:brightness-95 focus:ring-2 focus:ring-[#b51c00]/30"
                                  }`}
                            >
                              {/* Current status as first option */}
                              <option value={order.orderStatus}>
                                {statusConfig.label}
                              </option>
                              {/* Next valid statuses */}
                              {statusConfig.next.map((nextStatus) => (
                                <option key={nextStatus} value={nextStatus}>
                                  {orderStatusConfig[nextStatus].label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-md border text-xs font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                            >
                              {statusConfig.label}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              navigate(`/admin/order/${order._id}`)
                            }
                            className="w-8 h-8 mx-auto flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center text-gray-500 font-medium"
                    >
                      Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

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

          {/* ================= PAGINATION ================= */}
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
      </div>
    </div>
  );
};

export default OrderManagement;

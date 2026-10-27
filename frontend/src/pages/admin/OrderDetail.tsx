import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Clock,
  Truck,
  PackageCheck,
} from "lucide-react";
import { useAdminOrderStore } from "@/stores/useAdminOrderStore";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";

const OrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { currentOrder, loading, fetchOrderDetail, updateOrderStatus } =
    useAdminOrderStore();

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail(orderId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [orderId, fetchOrderDetail]);

  const getOrderStatusBadge = (status) => {
    const badges = {
      Pending: {
        bg: "bg-[#fef3c7]",
        text: "text-[#92400e]",
        label: "Chờ xử lý",
        icon: Clock,
      },
      Processing: {
        bg: "bg-[#dbeafe]",
        text: "text-[#1e40af]",
        label: "Đang xử lý",
        icon: Package,
      },
      Shipped: {
        bg: "bg-[#e0e7ff]",
        text: "text-[#4338ca]",
        label: "Đang giao",
        icon: Truck,
      },
      Delivered: {
        bg: "bg-[#d1fae5]",
        text: "text-[#15803d]",
        label: "Đã giao",
        icon: PackageCheck,
      },
      Cancelled: {
        bg: "bg-[#fee2e2]",
        text: "text-[#b91c1c]",
        label: "Đã hủy",
        icon: XCircle,
      },
    };
    return badges[status] || badges.Pending;
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      Pending: {
        bg: "bg-[#fef3c7]",
        text: "text-[#92400e]",
        label: "Chưa thanh toán",
      },
      Paid: {
        bg: "bg-[#d1fae5]",
        text: "text-[#15803d]",
        label: "Đã thanh toán",
      },
      Failed: {
        bg: "bg-[#fee2e2]",
        text: "text-[#b91c1c]",
        label: "Thất bại",
      },
      Refunded: {
        bg: "bg-[#e0e7ff]",
        text: "text-[#4338ca]",
        label: "Đã hoàn tiền",
      },
    };
    return badges[status] || badges.Pending;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      COD: "Thanh toán khi nhận hàng (COD)",
      VNPAY: "VNPAY",
      MOMO: "MoMo",
      STRIPE: "Stripe",
    };
    return labels[method] || method;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateSubtotal = () => {
    if (!currentOrder) return 0;
    return currentOrder.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  };

  // ================= CẤU HÌNH TRẠNG THÁI (GIỐNG OrderManagement.tsx) =================
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

  const getNextStatusOptions = (currentStatus) => {
    return orderStatusConfig[currentStatus]?.next || [];
  };

  const handleStatusUpdate = async (newOrderStatus) => {
    if (!orderId) return;

    try {
      setIsUpdating(true);
      await updateOrderStatus(orderId, { orderStatus: newOrderStatus });
      toast.success("Cập nhật trạng thái đơn hàng thành công");
    } catch (error) {
      // Error handled in store
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentStatusUpdate = async (newPaymentStatus) => {
    if (!orderId) return;

    try {
      setIsUpdating(true);
      await updateOrderStatus(orderId, { paymentStatus: newPaymentStatus });
      toast.success("Cập nhật trạng thái thanh toán thành công");
    } catch (error) {
      // Error handled in store
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#b51c00]" />
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Không tìm thấy đơn hàng</p>
          <button
            onClick={() => navigate("/admin/orders")}
            className="mt-4 px-4 py-2 bg-[#b51c00] text-white rounded-lg hover:bg-[#8e1400] transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const orderStatusBadge = getOrderStatusBadge(currentOrder.orderStatus);
  const paymentStatusBadge = getPaymentStatusBadge(currentOrder.paymentStatus);
  const nextStatusOptions = getNextStatusOptions(currentOrder.orderStatus);
  const StatusIcon = orderStatusBadge.icon;

  const statusTimeline = [
    { status: "Pending", label: "Chờ xử lý", icon: Clock },
    { status: "Processing", label: "Đang xử lý", icon: Package },
    { status: "Shipped", label: "Đang giao", icon: Truck },
    { status: "Delivered", label: "Đã giao", icon: PackageCheck },
  ];

  const getCurrentStatusIndex = () => {
    if (currentOrder.orderStatus === "Cancelled") return -1;
    return statusTimeline.findIndex(
      (s) => s.status === currentOrder.orderStatus,
    );
  };

  const currentStatusIndex = getCurrentStatusIndex();

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý đơn hàng", href: "/admin/orders" },
          { label: "Chi tiết đơn hàng", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* HEADER WITH BACK BUTTON */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white rounded-lg border border-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
                Chi tiết đơn hàng
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Mã đơn:{" "}
                <span className="font-mono font-bold text-[#b51c00]">
                  #{currentOrder._id.slice(-8).toUpperCase()}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${orderStatusBadge.bg} ${orderStatusBadge.text} font-bold`}
            >
              <StatusIcon className="w-5 h-5" />
              {orderStatusBadge.label}
            </div>
          </div>
        </div>

        {/* STATUS TIMELINE */}
        {currentOrder.orderStatus !== "Cancelled" && (
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 p-6">
            <h2 className="text-[18px] font-bold text-gray-900 mb-6">
              Tiến trình đơn hàng
            </h2>
            <div className="relative flex justify-between items-start">
              {statusTimeline.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div
                    key={step.status}
                    className="flex-1 flex flex-col items-center relative px-2"
                  >
                    {/* Icon Circle */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all z-10 ${
                        isActive
                          ? "bg-[#b51c00] border-[#b51c00] text-white"
                          : "bg-white border-gray-300 text-gray-400"
                      } ${isCurrent ? "ring-4 ring-[#fef2f2]" : ""}`}
                    >
                      <StepIcon className="w-6 h-6" />
                    </div>

                    {/* Label */}
                    <div className="mt-4 text-center">
                      <p
                        className={`text-sm font-semibold ${
                          isActive ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>

                    {/* Connecting Line */}
                    {index < statusTimeline.length - 1 && (
                      <div
                        className={`absolute top-6 left-1/2 w-full h-[3px] -translate-y-1/2 z-0 ${
                          index < currentStatusIndex
                            ? "bg-[#b51c00]"
                            : "bg-gray-200"
                        }`}
                        style={{ transform: "translateY(-50%)" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CANCELLED STATUS */}
        {currentOrder.orderStatus === "Cancelled" && (
          <div className="bg-[#fee2e2] border border-[#fecaca] rounded-[12px] p-6 flex items-center gap-4">
            <XCircle className="w-8 h-8 text-[#b91c1c] flex-shrink-0" />
            <div>
              <h3 className="font-bold text-[#991b1b] text-lg">
                Đơn hàng đã bị hủy
              </h3>
              <p className="text-sm text-[#b91c1c] mt-1">
                Đơn hàng này đã bị hủy và không thể thay đổi trạng thái.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - ORDER INFO */}
          <div className="lg:col-span-2 space-y-6">
            {/* PRODUCTS */}
            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#b51c00]" />
                  Sản phẩm đã đặt
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {currentOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
                  >
                    <img
                      src={item.productId?.images?.[0]}
                      alt={item.productId?.name || "Product"}
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200 bg-gray-50"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">
                        {item.productId?.name || "N/A"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Số lượng:{" "}
                        <span className="font-semibold text-gray-700">
                          {item.quantity}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Đơn giá:{" "}
                        <span className="font-bold text-gray-900">
                          {item.price.toLocaleString("vi-VN")} ₫
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#b51c00]">
                        {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CUSTOMER INFO */}
            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#b51c00]" />
                  Thông tin khách hàng
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Tên khách hàng</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {currentOrder.customerId?.userId?.displayName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {currentOrder.customerId?.userId?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {currentOrder.customerId?.userId?.phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* SHIPPING ADDRESS */}
            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#b51c00]" />
                  Địa chỉ giao hàng
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Người nhận</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {currentOrder.shippingAddress.recipient}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {currentOrder.shippingAddress.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Địa chỉ</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {currentOrder.shippingAddress.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - SUMMARY & ACTIONS */}
          <div className="space-y-6">
            {/* PAYMENT INFO */}
            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#b51c00]" />
                  Thanh toán
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tạm tính</span>
                  <span className="font-semibold text-gray-900">
                    {calculateSubtotal().toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phí vận chuyển</span>
                  <span className="font-semibold text-gray-900">
                    {currentOrder.shippingFee.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                {currentOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giảm giá</span>
                    <span className="font-semibold text-green-600">
                      -{currentOrder.discountAmount.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Tổng cộng</span>
                  <span className="font-bold text-[#b51c00] text-lg">
                    {currentOrder.totalAmount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    Phương thức thanh toán
                  </p>
                  <p className="font-semibold text-gray-900">
                    {getPaymentMethodLabel(currentOrder.paymentMethod)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    Trạng thái thanh toán
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold ${paymentStatusBadge.bg} ${paymentStatusBadge.text}`}
                  >
                    {paymentStatusBadge.label}
                  </span>
                </div>
              </div>
            </div>

            {/* ORDER DATES */}
            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-[18px] font-bold text-gray-900">
                  Thời gian
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Ngày tạo</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formatDate(currentOrder.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formatDate(currentOrder.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            {currentOrder.orderStatus !== "Delivered" &&
              currentOrder.orderStatus !== "Cancelled" && (
                <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-[18px] font-bold text-gray-900">
                      Thao tác
                    </h2>
                  </div>
                  <div className="p-6 space-y-3">
                    {nextStatusOptions.length > 0 && (
                      <>
                        <p className="text-sm text-gray-600 font-medium mb-2">
                          Cập nhật trạng thái đơn hàng
                        </p>
                        {nextStatusOptions.map((status) => {
                          const statusLabel = orderStatusConfig[status]?.label;
                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(status)}
                              disabled={isUpdating}
                              className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                status === "Cancelled"
                                  ? "bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fecaca]"
                                  : "bg-[#b51c00] text-white hover:bg-[#8e1400]"
                              }`}
                            >
                              {isUpdating && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              )}
                              Chuyển sang {statusLabel}
                            </button>
                          );
                        })}
                      </>
                    )}

                    {currentOrder.paymentStatus === "Pending" &&
                      currentOrder.paymentMethod === "COD" && (
                        <>
                          <Separator className="my-4" />
                          <p className="text-sm text-gray-600 font-medium mb-2">
                            Cập nhật thanh toán
                          </p>
                          <button
                            onClick={() => handlePaymentStatusUpdate("Paid")}
                            disabled={isUpdating}
                            className="w-full px-4 py-2.5 rounded-lg font-semibold text-sm bg-[#d1fae5] text-[#15803d] hover:bg-[#a7f3d0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isUpdating && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            <CheckCircle2 className="w-4 h-4" />
                            Đánh dấu Đã thanh toán
                          </button>
                        </>
                      )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

import { useEffect, useState } from "react";
import {
  X,
  Package,
  User,
  MapPin,
  CreditCard,
  Loader2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useAdminOrderStore } from "@/stores/useAdminOrderStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { Separator } from "@/components/ui/separator";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";

interface OrderDetailDrawerProps {
  orderId: string;
  isPinned: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onUpdated?: () => void;
}

const OrderDetailDrawer = ({
  orderId,
  isPinned,
  onClose,
  onMouseEnter,
  onMouseLeave,
  onUpdated,
}: OrderDetailDrawerProps) => {
  const { user } = useAdminAuthStore();
  const { currentOrder, loading, fetchOrderDetail, updateOrderStatus } =
    useAdminOrderStore();

  const [isUpdating, setIsUpdating] = useState(false);

  const canEdit = hasPermission(user, "orders_edit");

  useEffect(() => {
    if (orderId) fetchOrderDetail(orderId);
  }, [orderId, fetchOrderDetail]);

  const getOrderStatusBadge = (status: string) => {
    const badges = {
      Pending: {
        bg: "bg-[#fef3c7]",
        text: "text-[#92400e]",
        label: "Chờ xử lý",
        icon: Clock,
        next: ["Processing", "Cancelled"],
      },
      Processing: {
        bg: "bg-[#dbeafe]",
        text: "text-[#1e40af]",
        label: "Đang xử lý",
        icon: Package,
        next: ["Shipped", "Cancelled"],
      },
      Shipped: {
        bg: "bg-[#e0e7ff]",
        text: "text-[#4338ca]",
        label: "Đang giao",
        icon: Truck,
        next: ["Delivered"],
      },
      Delivered: {
        bg: "bg-[#d1fae5]",
        text: "text-[#15803d]",
        label: "Đã giao",
        icon: PackageCheck,
        next: [],
      },
      Cancelled: {
        bg: "bg-[#fee2e2]",
        text: "text-[#b91c1c]",
        label: "Đã hủy",
        icon: XCircle,
        next: [],
      },
    };
    return badges[status] || badges.Pending;
  };

  const getPaymentStatusBadge = (status: string) => {
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
      Failed: { bg: "bg-[#fee2e2]", text: "text-[#b91c1c]", label: "Thất bại" },
      Refunded: {
        bg: "bg-[#e0e7ff]",
        text: "text-[#4338ca]",
        label: "Đã hoàn tiền",
      },
    };
    return badges[status] || badges.Pending;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      COD: "Thanh toán khi nhận hàng (COD)",
      VNPAY: "VNPAY",
      MOMO: "MoMo",
      STRIPE: "Stripe",
    };
    return labels[method] || method;
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

  const calculateSubtotal = () => {
    if (!currentOrder) return 0;
    return currentOrder.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      await updateOrderStatus(orderId, { orderStatus: newStatus });
      toast.success("Cập nhật trạng thái đơn hàng thành công");
      await fetchOrderDetail(orderId);
      onUpdated?.();
    } catch {
      // store handles error
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentPaid = async () => {
    try {
      setIsUpdating(true);
      await updateOrderStatus(orderId, { paymentStatus: "Paid" });
      toast.success("Cập nhật thanh toán thành công");
      await fetchOrderDetail(orderId);
      onUpdated?.();
    } catch {
      // store handles error
    } finally {
      setIsUpdating(false);
    }
  };

  // Panel trong layout: sticky + chiều cao cố định bằng với bảng
  return (
    <div
      className="w-full h-[calc(120vh-8rem)] max-h-[calc(120vh-8rem)] bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden flex flex-col"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* HEADER */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900">
              Chi tiết đơn hàng
            </h2>
            {currentOrder && currentOrder._id === orderId && (
              <p className="text-sm text-gray-500 mt-0.5">
                Mã đơn:{" "}
                <span className="font-mono font-bold text-[#b51c00]">
                  #{currentOrder._id.slice(-8).toUpperCase()}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {currentOrder && currentOrder._id === orderId && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(() => {
              const b = getOrderStatusBadge(currentOrder.orderStatus);
              const Icon = b.icon;
              return (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${b.bg} ${b.text}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {b.label}
                </span>
              );
            })()}
            {isPinned && (
              <span className="text-[11px] font-semibold text-gray-400 px-2 py-1 bg-gray-50 rounded-md">
                Đã ghim
              </span>
            )}
          </div>
        )}
      </div>

      {/* BODY - có scroll nội dung */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#b51c00]" />
          </div>
        )}

        {!loading && currentOrder && currentOrder._id === orderId && (
          <>
            {/* Sản phẩm */}
            <section className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#b51c00]" />
                  Sản phẩm đã đặt
                </h3>
              </div>
              <div className="p-3 space-y-3">
                {currentOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <img
                      src={item.productId?.images?.[0]}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover border bg-gray-50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                        {item.productId?.name || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        SL: {item.quantity} ·{" "}
                        {item.price.toLocaleString("vi-VN")}₫
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[#b51c00] whitespace-nowrap">
                      {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Thanh toán */}
            <section className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#b51c00]" />
                  Thanh toán
                </h3>
              </div>
              <div className="p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tạm tính</span>
                  <span className="font-semibold">
                    {calculateSubtotal().toLocaleString("vi-VN")}₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ship</span>
                  <span className="font-semibold">
                    {currentOrder.shippingFee.toLocaleString("vi-VN")}₫
                  </span>
                </div>
                {currentOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>
                      -{currentOrder.discountAmount.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Tổng</span>
                  <span className="text-[#b51c00] text-base">
                    {currentOrder.totalAmount.toLocaleString("vi-VN")}₫
                  </span>
                </div>
                <p className="text-xs text-gray-500 pt-1">
                  {getPaymentMethodLabel(currentOrder.paymentMethod)}
                </p>
                {(() => {
                  const p = getPaymentStatusBadge(currentOrder.paymentStatus);
                  return (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${p.bg} ${p.text}`}
                    >
                      {p.label}
                    </span>
                  );
                })()}
              </div>
            </section>

            {/* KH */}
            <section className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#b51c00]" />
                  Khách hàng
                </h3>
              </div>
              <div className="p-3 space-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Tên</p>
                  <p className="font-semibold">
                    {currentOrder.customerId?.userId?.displayName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-800 break-all">
                    {currentOrder.customerId?.userId?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">SĐT</p>
                  <p className="font-semibold">
                    {currentOrder.customerId?.userId?.phone || "N/A"}
                  </p>
                </div>
              </div>
            </section>

            {/* Giao hàng */}
            <section className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#b51c00]" />
                  Địa chỉ giao hàng
                </h3>
              </div>
              <div className="p-3 space-y-2 text-sm">
                <p className="font-semibold">
                  {currentOrder.shippingAddress?.recipient}
                </p>
                <p className="text-gray-600">
                  {currentOrder.shippingAddress?.phone}
                </p>
                <p className="text-gray-700">
                  {currentOrder.shippingAddress?.address}
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-gray-100 p-3 text-sm space-y-2">
              <div>
                <p className="text-xs text-gray-500">Ngày tạo</p>
                <p className="font-semibold">
                  {formatDate(currentOrder.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cập nhật</p>
                <p className="font-semibold">
                  {formatDate(currentOrder.updatedAt)}
                </p>
              </div>
            </section>

            {/* THAO TÁC - Giống OrderDetail.tsx */}
            {canEdit &&
              currentOrder.orderStatus !== "Delivered" &&
              currentOrder.orderStatus !== "Cancelled" && (
                <section className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50">
                  <p className="text-sm font-bold text-gray-900">Thao tác</p>
                  {(() => {
                    const statusBadge = getOrderStatusBadge(
                      currentOrder.orderStatus,
                    );
                    const nextStatuses = statusBadge.next || [];
                    return (
                      nextStatuses.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 font-medium">
                            Cập nhật trạng thái đơn
                          </p>
                          {nextStatuses.map((st) => (
                            <button
                              key={st}
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStatusUpdate(st)}
                              className={`w-full px-3 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 ${st === "Cancelled"
                                ? "bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fecaca]"
                                : "bg-[#b51c00] text-white hover:bg-[#8e1400]"
                                }`}
                            >
                              {isUpdating && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              )}
                              Chuyển sang {getOrderStatusBadge(st).label}
                            </button>
                          ))}
                        </div>
                      )
                    );
                  })()}
                  {currentOrder.paymentStatus === "Pending" &&
                    currentOrder.paymentMethod === "COD" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={handlePaymentPaid}
                        className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#d1fae5] text-[#15803d] hover:bg-[#a7f3d0] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Đánh dấu Đã thanh toán
                      </button>
                    )}
                </section>
              )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetailDrawer;

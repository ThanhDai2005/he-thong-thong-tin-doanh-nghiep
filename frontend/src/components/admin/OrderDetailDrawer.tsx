import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
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
  const printRef = useRef<HTMLDivElement>(null);

  const canEdit = hasPermission(user, "orders_edit");

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Hóa đơn #${currentOrder?._id.slice(-8).toUpperCase()}`,
  });

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
    <>
      <style>{`
        @media print {
          @page {
            margin: 12mm 10mm;
            size: A4 portrait;
          }

          header, footer, nav, .no-print, .header, .footer {
            display: none !important;
          }
        }
      `}</style>

      {/* ============================================================ */}
      {/* BẢN IN HÓA ĐƠN — Giống OrderDetailPage.tsx                    */}
      {/* ============================================================ */}
      <div
        ref={printRef}
        className="hidden print:block text-gray-900 font-sans max-w-4xl mx-auto"
      >
        {currentOrder && currentOrder._id === orderId && (
          <>
            {/* Brand header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-1">
                <img
                  src="/logo.webp"
                  alt="Logo Đặc Sản Ba Miền"
                  className="w-20 h-auto object-cover"
                />
              </div>

              <h1 className="text-3xl font-bold text-[#b51c00] tracking-tight">
                Đặc Sản Ba Miền
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Nền tảng đặt đồ ăn trực tuyến
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Hotline: 1900 xxxx | Email: support@ds3mvn.com
              </p>
            </div>

            <div className="border-t-2 border-gray-300 mb-8"></div>

            {/* Invoice meta row */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                  Mã Hóa đơn
                </p>
                <p className="text-lg font-bold text-gray-900">
                  #{currentOrder._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
                  Ngày đặt
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(currentOrder.createdAt)}
                </p>
              </div>
            </div>

            {/* Customer info */}
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-800 pb-2 mb-3">
                Thông tin khách hàng
              </h2>
              <div className="text-base text-gray-800 space-y-2">
                <p>
                  <span className="font-semibold text-gray-900 inline-block w-32">
                    Người nhận:
                  </span>
                  {currentOrder.shippingAddress.recipient}
                </p>
                <p>
                  <span className="font-semibold text-gray-900 inline-block w-32">
                    Điện thoại:
                  </span>
                  {currentOrder.shippingAddress.phone}
                </p>
                <p>
                  <span className="font-semibold text-gray-900 inline-block w-38">
                    Địa chỉ giao hàng:
                  </span>
                  {currentOrder.shippingAddress.address}
                </p>
              </div>
            </div>

            {/* Order items */}
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-800 pb-2 mb-3">
                Chi tiết đơn hàng
              </h2>
              <table className="w-full text-base border-collapse mt-2">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 pr-2 font-bold w-12 text-gray-700">
                      STT
                    </th>
                    <th className="text-left py-2 pr-2 font-bold text-gray-700">
                      Món
                    </th>
                    <th className="text-center py-2 px-2 font-bold w-16 text-gray-700">
                      SL
                    </th>
                    <th className="text-right py-2 px-2 font-bold w-32 text-gray-700">
                      Giá
                    </th>
                    <th className="text-right py-2 pl-2 font-bold w-36 text-gray-700">
                      Tổng tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrder.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-3 pr-2 text-gray-600">{idx + 1}</td>
                      <td className="py-3 pr-2 font-semibold text-gray-900">
                        {item.productId?.name || "N/A"}
                      </td>
                      <td className="py-3 px-2 text-center text-gray-800">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-800">
                        {item.price.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="py-3 pl-2 text-right font-bold text-gray-900">
                        {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Two-column summary: Invoice info | Payment info */}
            <div className="grid grid-cols-2 gap-12 pt-6 border-t-2 border-gray-800 print:break-inside-avoid">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  Thông tin thanh toán
                </h3>
                <div className="text-base space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phương thức</span>
                    <span className="font-semibold text-gray-900 text-right">
                      {getPaymentMethodLabel(currentOrder.paymentMethod)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thanh toán</span>
                    <span className="font-semibold text-gray-900">
                      {getPaymentStatusBadge(currentOrder.paymentStatus).label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Đơn hàng</span>
                    <span className="font-semibold text-gray-900">
                      {getOrderStatusBadge(currentOrder.orderStatus).label}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 text-right">
                  Tổng kết hóa đơn
                </h3>
                <div className="text-base space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="font-semibold text-gray-900">
                      {calculateSubtotal().toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí giao hàng</span>
                    <span className="font-semibold text-gray-900">
                      {currentOrder.shippingFee.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  {currentOrder.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Khuyến mãi</span>
                      <span className="font-semibold text-green-600">
                        - {currentOrder.discountAmount.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 mt-3 border-t border-gray-300">
                    <span className="font-bold text-gray-900 uppercase">
                      Tổng cộng
                    </span>
                    <span className="font-black text-[#b51c00] text-xl">
                      {currentOrder.totalAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* GIAO DIỆN HIỂN THỊ TRÊN MÀN HÌNH                             */}
      {/* ============================================================ */}
      <div
        className="print:hidden w-full h-[calc(120vh-8rem)] max-h-[calc(120vh-8rem)] bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden flex flex-col"
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
            <div className="flex items-center gap-2">
              {/* Nút in hóa đơn */}
              {currentOrder && currentOrder._id === orderId && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                  title="In hóa đơn"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#b51c00]">
                    print
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                title="Đóng"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
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
                                className={`w-full px-3 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 ${
                                  st === "Cancelled"
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
    </>
  );
};

export default OrderDetailDrawer;

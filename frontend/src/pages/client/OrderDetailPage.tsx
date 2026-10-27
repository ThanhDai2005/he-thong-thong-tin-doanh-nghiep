import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useOrderStore } from "@/stores/useOrderStore";
import { toast } from "sonner";
import { confirmCancelOrder } from "@/lib/sweetalert";

const statusConfig = {
  Pending: {
    label: "Chờ xác nhận",
    color: "bg-yellow-100 text-yellow-800",
    icon: "pending_actions",
    step: 1,
  },
  Processing: {
    label: "Đang chế biến",
    color: "bg-blue-100 text-blue-800",
    icon: "restaurant",
    step: 2,
  },
  Shipped: {
    label: "Đang giao hàng",
    color: "bg-purple-100 text-purple-800",
    icon: "local_shipping",
    step: 3,
  },
  Delivered: {
    label: "Đã hoàn thành",
    color: "bg-green-100 text-green-800",
    icon: "task_alt",
    step: 4,
  },
  Cancelled: {
    label: "Đã hủy đơn",
    color: "bg-red-100 text-red-800",
    icon: "cancel",
    step: 0,
  },
};

const paymentLabels = {
  COD: "Thanh toán tiền mặt khi nhận hàng (COD)",
  VNPAY: "Ví VNPAY",
  MOMO: "Ví MoMo",
};

const paymentStatusLabels = {
  Pending: { label: "Chưa thanh toán", color: "text-yellow-600 bg-yellow-50" },
  Paid: { label: "Đã thanh toán", color: "text-green-600 bg-green-50" },
  Failed: { label: "Thất bại", color: "text-red-600 bg-red-50" },
  Refunded: { label: "Đã hoàn tiền", color: "text-gray-600 bg-gray-50" },
};

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentOrder, loading, getOrderDetail, retryPayment, cancelOrder } =
    useOrderStore();
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = async () => {
    try {
      await getOrderDetail(orderId!);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tải đơn hàng");
      navigate("/orders");
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading || !currentOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const order = currentOrder;
  const config = statusConfig[order.orderStatus];
  const currentStep = config.step;
  const subtotal = order.totalAmount + order.discountAmount - order.shippingFee;
  const orderCode = order._id.toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleString("vi-VN");

  const handlePrintInvoice = () => {
    const originalTitle = document.title;
    document.title = `Đặc Sản Ba Miền - Tinh Hoa Món Ăn Việt`;

    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 100);
  };

  const handleRetryPayment = async () => {
    if (!orderId) return;

    try {
      setRetryingPayment(true);
      const response = await retryPayment(orderId);

      if (response.paymentUrl) {
        toast.success("Đang chuyển hướng đến cổng thanh toán...");
        window.location.href = response.paymentUrl;
      } else {
        toast.error("Không thể tạo liên kết thanh toán");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Lỗi khi thử thanh toán lại",
      );
      setRetryingPayment(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId || !currentOrder) return;

    // SweetAlert2 confirmation dialog
    const result = await confirmCancelOrder();

    if (!result.isConfirmed) return;

    try {
      setCancelling(true);
      await cancelOrder(orderId);
      toast.success("Đơn hàng đã được hủy thành công");
      await fetchOrder(); // Reload order details
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi hủy đơn hàng");
    } finally {
      setCancelling(false);
    }
  };

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
      {/* BẢN IN HÓA ĐƠN — Lớn hơn, rõ ràng hơn                          */}
      {/* ============================================================ */}
      <div className="hidden print:block text-gray-900 font-sans max-w-4xl mx-auto">
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
            <p className="text-lg font-bold text-gray-900">#{orderCode}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">
              Ngày đặt
            </p>
            <p className="text-lg font-semibold text-gray-900">{orderDate}</p>
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
              {order.shippingAddress.recipient}
            </p>
            <p>
              <span className="font-semibold text-gray-900 inline-block w-32">
                Điện thoại:
              </span>
              {order.shippingAddress.phone}
            </p>
            <p>
              <span className="font-semibold text-gray-900 inline-block w-38">
                Địa chỉ giao hàng:
              </span>
              {order.shippingAddress.address}
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
              {order.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-3 pr-2 text-gray-600">{idx + 1}</td>
                  <td className="py-3 pr-2 font-semibold text-gray-900">
                    {item.productId.name}
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
                  {paymentLabels[order.paymentMethod]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thanh toán</span>
                <span className="font-semibold text-gray-900">
                  {paymentStatusLabels[order.paymentStatus].label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đơn hàng</span>
                <span className="font-semibold text-gray-900">
                  {config.label}
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
                  {subtotal.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí giao hàng</span>
                <span className="font-semibold text-gray-900">
                  {order.shippingFee.toLocaleString("vi-VN")}đ
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-600">Khuyến mãi</span>
                  <span className="font-semibold text-green-600">
                    - {order.discountAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 mt-3 border-t border-gray-300">
                <span className="font-bold text-gray-900 uppercase">
                  Tổng cộng
                </span>
                <span className="font-black text-[#b51c00] text-xl">
                  {order.totalAmount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* GIAO DIỆN HIỂN THỊ TRÊN MÀN HÌNH                             */}
      {/* ============================================================ */}
      <div className="print:hidden max-w-7xl mx-auto px-4 md:px-8 py-8 bg-[#f9f9f9] min-h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-[#b51c00] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              Quay lại danh sách đơn hàng
            </button>

            <button
              onClick={handlePrintInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#b51c00] text-[#b51c00] rounded-xl font-bold text-sm hover:bg-[#b51c00] hover:text-white transition-all shadow-sm hover:shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">
                print
              </span>
              In hóa đơn
            </button>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Chi tiết đơn hàng
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">
                  tag
                </span>
                {orderCode}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 font-medium">
                Trạng thái:
              </span>
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide flex items-center gap-1.5 ${config.color}`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {config.icon}
                </span>
                {config.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline Tracking */}
            {order.orderStatus !== "Cancelled" && (
              <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100">
                <h2 className="text-base font-bold text-gray-900 mb-6">
                  Tiến trình đơn hàng
                </h2>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#b51c00] transition-all duration-1000 ease-out"
                      style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                    ></div>
                  </div>
                  <div className="relative flex justify-between">
                    {[1, 2, 3, 4].map((step) => {
                      const isActive = step <= currentStep;
                      const isCurrent = step === currentStep;
                      const labels = [
                        "Chờ xác nhận",
                        "Đang chế biến",
                        "Đang giao",
                        "Hoàn thành",
                      ];
                      const icons = [
                        "pending_actions",
                        "restaurant",
                        "local_shipping",
                        "task_alt",
                      ];

                      return (
                        <div
                          key={step}
                          className="flex flex-col items-center gap-2 w-20 relative z-10"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${
                              isActive
                                ? "bg-[#b51c00] text-white shadow-md shadow-red-100"
                                : "bg-white border-2 border-gray-200 text-gray-300"
                            } ${isCurrent ? "ring-4 ring-red-50" : ""}`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {icons[step - 1]}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider text-center ${
                              isActive ? "text-[#b51c00]" : "text-gray-400"
                            }`}
                          >
                            {labels[step - 1]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Products List */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                <span className="material-symbols-outlined text-[#b51c00]">
                  restaurant_menu
                </span>
                Món ăn đã đặt
              </h2>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 pb-4 border-b border-gray-50 last:border-b-0 last:pb-0"
                  >
                    <img
                      src={item.productId.images[0] || "/placeholder.png"}
                      alt={item.productId.name}
                      className="w-20 h-20 object-cover rounded-xl bg-gray-50 border border-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight">
                        {item.productId.name}
                      </h3>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex flex-col">
                          <p className="text-xs text-gray-500 font-medium">
                            Đơn giá: {item.price.toLocaleString("vi-VN")}đ
                          </p>
                          <p className="text-xs font-bold text-[#b51c00] mt-1 bg-red-50 px-2 py-0.5 rounded inline-block w-max">
                            SL: x{item.quantity}
                          </p>
                        </div>
                        <p className="font-black text-gray-900 text-lg">
                          {(item.price * item.quantity).toLocaleString("vi-VN")}
                          đ
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#b51c00]">
                  location_on
                </span>
                Thông tin nhận hàng
              </h2>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex gap-2">
                  <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0">
                    person
                  </span>
                  <p className="font-bold text-gray-900 text-sm">
                    {order.shippingAddress.recipient}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0">
                    call
                  </span>
                  <p className="text-sm text-gray-700 font-medium">
                    {order.shippingAddress.phone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0 mt-0.5">
                    home_pin
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {order.shippingAddress.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-50 pb-4">
                <span className="material-symbols-outlined text-[#b51c00]">
                  receipt_long
                </span>
                Thanh toán
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Tạm tính</span>
                  <span className="font-bold text-gray-900">
                    {subtotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">
                    Phí giao hàng
                  </span>
                  <span className="font-bold text-gray-900">
                    {order.shippingFee.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-600">Khuyến mãi</span>
                    <span className="font-semibold text-green-600">
                      - {order.discountAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-gray-900 font-black">Tổng cộng</span>
                  <span className="text-2xl font-black text-[#b51c00]">
                    {order.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-50">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                    Phương thức
                  </span>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-gray-400">
                      payments
                    </span>
                    {paymentLabels[order.paymentMethod]}
                  </p>
                </div>
                <div className="flex flex-col gap-1 mt-3">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                    Trạng thái
                  </span>
                  <div className="flex items-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        paymentStatusLabels[order.paymentStatus]?.color
                      }`}
                    >
                      {paymentStatusLabels[order.paymentStatus]?.label}
                    </span>
                  </div>
                </div>

                {order.paymentStatus === "Pending" &&
                  (order.paymentMethod === "MOMO" ||
                    order.paymentMethod === "VNPAY") &&
                  order.orderStatus !== "Cancelled" && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <button
                        onClick={handleRetryPayment}
                        disabled={retryingPayment}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#b51c00] text-white font-bold text-sm hover:bg-[#8e1400] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          credit_card
                        </span>
                        {retryingPayment ? "Đang xử lý..." : "Thanh toán ngay"}
                      </button>
                    </div>
                  )}

                {/* Cancel Button - Only for Pending & Unpaid */}
                {order.orderStatus === "Pending" &&
                  order.paymentStatus !== "Paid" && (
                    <div className="mt-3">
                      <button
                        onClick={handleCancelOrder}
                        disabled={cancelling}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-red-500 text-red-600 font-bold text-sm hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          cancel
                        </span>
                        {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
                      </button>
                    </div>
                  )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-center">
                <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    schedule
                  </span>
                  Đặt lúc: {orderDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailPage;

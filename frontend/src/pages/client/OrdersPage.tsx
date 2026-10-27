import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useOrderStore } from "@/stores/useOrderStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import Pagination from "@/components/client/Pagination";
import { toast } from "sonner";
import { confirmCancelOrder } from "@/lib/sweetalert";

const statusConfig = {
  Pending: {
    label: "Chờ xác nhận",
    color: "bg-yellow-100 text-yellow-800",
    icon: "pending_actions",
  },
  Processing: {
    label: "Đang chế biến",
    color: "bg-blue-100 text-blue-800",
    icon: "restaurant",
  },
  Shipped: {
    label: "Đang giao hàng",
    color: "bg-purple-100 text-purple-800",
    icon: "local_shipping",
  },
  Delivered: {
    label: "Đã hoàn thành",
    color: "bg-green-100 text-green-800",
    icon: "task_alt",
  },
  Cancelled: {
    label: "Đã hủy đơn",
    color: "bg-red-100 text-red-800",
    icon: "cancel",
  },
};

const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    orders,
    loading,
    totalPages,
    getMyOrders,
    retryPayment,
    cancelOrder,
  } = useOrderStore();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();

  // Đọc state từ URL Parameters thay vì React State để khi Back lại vẫn giữ nguyên trang
  const currentPage = parseInt(searchParams.get("page") || "1");
  const filterStatus = searchParams.get("status") || "";

  const [reordering, setReordering] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const updateURL = (newParams: Record<string, string>) => {
    const params = Object.fromEntries(searchParams.entries());
    const mergedParams = { ...params, ...newParams };

    Object.keys(mergedParams).forEach((key) => {
      if (!mergedParams[key] || (key === "page" && mergedParams[key] === "1")) {
        delete mergedParams[key];
      }
    });
    setSearchParams(mergedParams);
  };

  const handleStatusChange = (status: string) => {
    updateURL({ status: status, page: "1" });
  };

  const fetchOrders = async () => {
    try {
      await getMyOrders(currentPage, 5, filterStatus || undefined);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách đơn hàng");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, currentPage, filterStatus]);

  const handleReorder = async (order: any) => {
    try {
      setReordering(true);
      const successItems: string[] = [];
      const failedItems: string[] = [];

      for (const item of order.items) {
        try {
          if (item.productId.stock && item.productId.stock < item.quantity) {
            failedItems.push(
              `${item.productId.name} (chỉ còn ${item.productId.stock} sản phẩm)`,
            );
            continue;
          }

          await addToCart(item.productId._id, item.quantity);
          successItems.push(item.productId.name);
        } catch (error: any) {
          failedItems.push(item.productId.name);
        }
      }

      if (successItems.length > 0 && failedItems.length === 0) {
        toast.success(`Đã thêm ${successItems.length} món vào giỏ hàng!`);
        navigate("/cart");
      } else if (successItems.length > 0 && failedItems.length > 0) {
        toast.warning(
          `Đã thêm ${successItems.length} món vào giỏ. ${failedItems.length} món không khả dụng: ${failedItems.join(", ")}`,
        );
        navigate("/cart");
      } else {
        toast.error("Tất cả sản phẩm trong đơn hàng đều không khả dụng");
      }
    } catch (error) {
      toast.error("Lỗi khi thêm sản phẩm vào giỏ hàng");
    } finally {
      setReordering(false);
    }
  };

  const handleReview = (orderId: string) => {
    navigate(`/orders/${orderId}/review`);
  };

  const handleRetryPayment = async (orderId: string) => {
    try {
      setRetryingPayment(orderId);
      const response = await retryPayment(orderId);

      if (response?.paymentUrl) {
        toast.success("Đang chuyển hướng đến cổng thanh toán...");
        window.location.href = response?.paymentUrl;
      } else {
        toast.error("Không thể tạo liên kết thanh toán");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Lỗi khi thử thanh toán lại",
      );
    } finally {
      setRetryingPayment(null);
    }
  };

  const handleCancelOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await confirmCancelOrder();

    if (!result.isConfirmed) return;

    try {
      setCancelling(orderId);
      await cancelOrder(orderId);
      toast.success("Đơn hàng đã được hủy thành công");
      await fetchOrders(); // Reload orders list
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi hủy đơn hàng");
    } finally {
      setCancelling(null);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="h-48 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 bg-[#f9f9f9] min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Đơn hàng của tôi
      </h1>

      {/* Status Filter Tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        <button
          onClick={() => handleStatusChange("")}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
            filterStatus === ""
              ? "bg-[#b51c00] text-white shadow-md shadow-red-100"
              : "bg-white text-gray-600 border border-gray-200 hover:border-[#b51c00]/30"
          }`}
        >
          Tất cả
        </button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => handleStatusChange(key)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filterStatus === key
                ? "bg-[#b51c00] text-white shadow-md shadow-red-100"
                : "bg-white text-gray-600 border border-gray-200 hover:border-[#b51c00]/30"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {config.icon}
            </span>
            {config.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[40px] text-gray-300">
              receipt_long
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Chưa có đơn hàng nào
          </h2>
          <p className="text-gray-500 mb-8">
            Bạn chưa thực hiện đơn đặt hàng nào trong trạng thái này
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#b51c00] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-[#8e1400] transition"
          >
            Khám phá món ngon ngay
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const config = statusConfig[order.orderStatus];
            const isDelivered = order.orderStatus === "Delivered";
            const isCancelled = order.orderStatus === "Cancelled";
            const isProcessing = ["Pending", "Processing", "Shipped"].includes(
              order.orderStatus,
            );
            const isPendingPayment =
              order.paymentStatus === "Pending" &&
              (order.paymentMethod === "MOMO" ||
                order.paymentMethod === "VNPAY") &&
              !isCancelled;

            return (
              <div
                key={order._id}
                onClick={() => navigate(`/orders/${order._id}`)}
                className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${config.color.split(" ")[0]}`}
                    >
                      <span
                        className={`material-symbols-outlined ${
                          config.color.split(" ")[1]
                        }`}
                      >
                        {config.icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Mã đơn hàng
                      </p>
                      <p className="font-bold text-gray-900">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                    <span
                      className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-wide ${config.color}`}
                    >
                      {config.label}
                    </span>
                    <p className="text-xs text-gray-400 font-medium">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <img
                        src={item.productId.images[0] || "/placeholder.png"}
                        alt={item.productId.name}
                        className="w-16 h-16 object-cover rounded-xl bg-gray-50 border border-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm md:text-base line-clamp-1">
                          {item.productId.name}
                        </p>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          Số lượng: x{item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">
                        {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-gray-400 font-bold bg-gray-50 inline-block px-3 py-1 rounded-full">
                      + {order.items.length - 2} sản phẩm khác
                    </p>
                  )}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium">
                      Tổng thanh toán:
                    </span>
                    <span className="text-xl font-black text-[#b51c00]">
                      {order.totalAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 w-full md:w-auto">
                    {/* Cancel Button - Only for Pending & Unpaid */}
                    {order.orderStatus === "Pending" &&
                      order.paymentStatus !== "Paid" && (
                        <button
                          onClick={(e) => handleCancelOrder(order._id, e)}
                          disabled={cancelling === order._id}
                          className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border-2 border-red-500 text-red-600 font-bold text-sm hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            cancel
                          </span>
                          {cancelling === order._id ? "Đang hủy..." : "Hủy đơn"}
                        </button>
                      )}

                    {isPendingPayment && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetryPayment(order._id);
                        }}
                        disabled={retryingPayment === order._id}
                        className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-[#b51c00] text-white font-bold text-sm hover:bg-[#8e1400] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          credit_card
                        </span>
                        {retryingPayment === order._id
                          ? "Đang xử lý..."
                          : "Thanh toán ngay"}
                      </button>
                    )}

                    {isProcessing && !isPendingPayment && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order._id}`);
                        }}
                        className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-[#b51c00] text-white font-bold text-sm hover:bg-[#8e1400] transition flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          local_shipping
                        </span>
                        Theo dõi đơn
                      </button>
                    )}

                    {isDelivered && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/orders/${order._id}`);
                          }}
                          className="flex-1 md:flex-none px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-bold text-sm hover:border-gray-400 hover:bg-gray-50 transition"
                        >
                          Xem chi tiết
                        </button>
                        {order.hasReviewed ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/${order._id}/reviews`);
                            }}
                            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl border-2 border-green-500 text-green-600 font-bold text-sm hover:bg-green-50 transition flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              check_circle
                            </span>
                            Xem đánh giá
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview(order._id);
                            }}
                            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl border-2 border-[#b51c00] text-[#b51c00] font-bold text-sm hover:bg-red-50 transition"
                          >
                            Đánh giá
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorder(order);
                          }}
                          disabled={reordering}
                          className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-[#b51c00] text-white font-bold text-sm hover:bg-[#8e1400] transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {reordering ? "Đang xử lý..." : "Đặt lại"}
                        </button>
                      </>
                    )}

                    {isCancelled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order._id}`);
                        }}
                        className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-bold text-sm hover:border-gray-400 hover:bg-gray-50 transition"
                      >
                        Xem chi tiết
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => updateURL({ page: page.toString() })}
        />
      )}
    </div>
  );
};

export default OrdersPage;

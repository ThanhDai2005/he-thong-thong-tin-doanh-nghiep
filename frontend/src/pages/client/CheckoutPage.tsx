import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/stores/useCartStore";
import { useOrderStore } from "@/stores/useOrderStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePromotionStore } from "@/stores/usePromotionStore";
import { toast } from "sonner";

const checkoutSchema = z.object({
  recipient: z.string().min(2, "Tên người nhận phải có ít nhất 2 ký tự"),
  phone: z
    .string()
    .regex(/^(03|05|07|08|09)\d{8}$/, "Số điện thoại không hợp lệ"),
  address: z.string().min(10, "Địa chỉ phải có ít nhất 10 ký tự"),
  paymentMethod: z.enum(["COD", "VNPAY", "MOMO", "STRIPE"]),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getCart, clearCart } = useCartStore();
  const { createOrder } = useOrderStore();
  const { user } = useAuthStore();
  const { appliedPromotion, clearPromotion } = usePromotionStore();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "COD",
    },
  });

  useEffect(() => {
    getCart();

    if (user) {
      setValue("recipient", user.displayName);
      setValue("phone", user.phone);
      if (user.address) {
        setValue("address", user.address);
      }
    }
  }, [user, setValue, getCart, navigate]);

  const calculateSubtotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shippingFee = subtotal > 0 ? 30000 : 0;
  const discount = appliedPromotion?.discountAmount || 0;
  const total = subtotal + shippingFee - discount;

  const onSubmit = async (data: CheckoutForm) => {
    if (!cart?.items || cart.items.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }

    try {
      setSubmitting(true);
      const orderData = {
        items: cart.items.map((item) => ({
          productId: item.productId._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          recipient: data.recipient,
          phone: data.phone,
          address: data.address,
        },
        paymentMethod: data.paymentMethod,
        orderPromotionId: appliedPromotion?.orderPromotionId,
        customerVoucherId: appliedPromotion?.customerVoucherId,
      };

      const order = await createOrder(orderData);

      // Handle Momo payment redirect
      if (data.paymentMethod === "MOMO" && order.paymentUrl) {
        clearCart();
        clearPromotion();
        toast.success("Đang chuyển đến trang thanh toán MoMo...");
        // Redirect to Momo payment page
        window.location.href = order.paymentUrl;
        return;
      }

      // Handle VNPAY payment redirect
      if (data.paymentMethod === "VNPAY" && order.paymentUrl) {
        clearCart();
        clearPromotion();
        toast.success("Đang chuyển đến trang thanh toán VNPAY...");
        // Redirect to VNPAY payment page
        window.location.href = order.paymentUrl;
        return;
      }

      // Handle other payment methods (COD, STRIPE)
      clearCart();
      clearPromotion();
      toast.success("Đặt hàng thành công!");
      navigate(`/orders/${order._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi đặt hàng");
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Giỏ hàng trống
        </h2>
        <button
          onClick={() => navigate("/")}
          className="bg-[#b51c00] text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition shadow-md"
        >
          Trở về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 bg-[#f9f9f9] min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Thanh toán</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Info */}
            <section className="bg-white rounded-xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
                <span className="material-symbols-outlined text-[#b51c00]">
                  local_shipping
                </span>
                <h2 className="text-lg font-bold text-gray-900">
                  Địa chỉ giao hàng
                </h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tên người nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("recipient")}
                    className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
                    placeholder="Nhập tên người nhận"
                  />
                  {errors.recipient && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        error
                      </span>
                      {errors.recipient.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("phone")}
                    className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
                    placeholder="VD: 0912345678"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        error
                      </span>
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Địa chỉ chi tiết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("address")}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        error
                      </span>
                      {errors.address.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-white rounded-xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
                <span className="material-symbols-outlined text-[#b51c00]">
                  payments
                </span>
                <h2 className="text-lg font-bold text-gray-900">
                  Phương thức thanh toán
                </h2>
              </div>
              <div className="space-y-3">
                {[
                  {
                    value: "COD",
                    label: "Thanh toán tiền mặt khi nhận hàng (COD)",
                    icon: "payments",
                  },
                  {
                    value: "VNPAY",
                    label: "Ví VNPAY",
                    icon: "account_balance_wallet",
                  },
                  {
                    value: "MOMO",
                    label: "Ví MoMo",
                    icon: "account_balance_wallet",
                  },
                ].map((method) => (
                  <label
                    key={method.value}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-[#b51c00]/50 transition-colors has-[:checked]:border-[#b51c00] has-[:checked]:bg-red-50/30"
                  >
                    <input
                      type="radio"
                      {...register("paymentMethod")}
                      value={method.value}
                      className="w-4 h-4 text-[#b51c00] focus:ring-[#b51c00] cursor-pointer"
                    />
                    <span className="material-symbols-outlined text-gray-500 text-[20px]">
                      {method.icon}
                    </span>
                    <span className="font-semibold text-gray-800 text-sm">
                      {method.label}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Right Sidebar: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-50 pb-4">
                Đơn hàng của bạn
              </h2>

              {/* Order Items List */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {cart.items.map((item) => (
                  <div key={item.productId._id} className="flex gap-3">
                    <img
                      src={item.productId.images[0] || "/placeholder.png"}
                      alt={item.productId.name}
                      className="w-14 h-14 object-cover rounded-md bg-gray-50 border border-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                        {item.productId.name}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500 font-medium">
                          SL: x{item.quantity}
                        </p>
                        <p className="text-sm font-bold text-[#b51c00]">
                          {(item.price * item.quantity).toLocaleString("vi-VN")}
                          đ
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Tạm tính</span>
                  <span className="font-semibold">
                    {subtotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Phí giao hàng</span>
                  <span className="font-semibold">
                    {shippingFee.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span>Khuyến mãi</span>
                    <span className="font-semibold">
                      - {discount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                  <span className="text-gray-900 font-bold">
                    Tổng thanh toán
                  </span>
                  <span className="text-xl font-bold text-[#b51c00]">
                    {total.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-8 bg-[#b51c00] text-white py-3.5 rounded-xl font-bold hover:bg-[#8e1400] transition shadow-md shadow-red-100 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">
                      progress_activity
                    </span>
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận đặt hàng"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;

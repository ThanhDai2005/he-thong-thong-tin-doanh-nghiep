import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useCartStore } from "@/stores/useCartStore";
import { usePromotionStore } from "@/stores/usePromotionStore";
import { toast } from "sonner";
import type { AvailablePromotion } from "@/types/promotion";
import {
  CheckCircle2,
  Tag,
  Trash2,
  Minus,
  Plus,
  PlusCircle,
  ChevronDown,
  Gift,
  Ticket,
  X,
  ShoppingCart,
} from "lucide-react";

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, loading, getCart, updateQuantity, removeFromCart } =
    useCartStore();
  const {
    applyPromotion,
    applyPromotionById,
    appliedPromotion,
    clearPromotion,
    getAvailablePromotions,
    availablePromotions,
  } = usePromotionStore();

  const [promoCode, setPromoCode] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [showPromoDropdown, setShowPromoDropdown] = useState(false);

  const cartLength = cart?.items.reduce(
    (tong, item) => tong + item.quantity,
    0,
  );

  const calculateSubtotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shippingFee = subtotal > 0 ? 30000 : 0;
  const discount = appliedPromotion?.discountAmount || 0;
  const total = Math.max(0, subtotal + shippingFee - discount);

  useEffect(() => {
    getCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [getCart, navigate]);

  useEffect(() => {
    if (cart?.items && cart.items.length > 0) {
      getAvailablePromotions();
    }
  }, [cart?.items?.length, getAvailablePromotions]);

  // Auto-apply từ VoucherPage: chờ list available xong, ghi đè mã cũ
  useEffect(() => {
    const autoCode = localStorage.getItem("autoApplyPromoCode");
    if (!autoCode || subtotal <= 0) return;

    // Chưa load xong danh sách KM → đợi lần render sau
    if (!availablePromotions) return;

    localStorage.removeItem("autoApplyPromoCode");
    setPromoCode(autoCode);

    const run = async () => {
      try {
        // Ghi đè mã đang dùng (nếu có)
        if (appliedPromotion) {
          clearPromotion();
        }
        setApplyingPromo(true);
        await applyPromotion(autoCode.trim().toUpperCase(), subtotal);
        toast.success(`Đã áp dụng mã ${autoCode.toUpperCase()}`);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Mã khuyến mãi không hợp lệ",
        );
      } finally {
        setApplyingPromo(false);
      }
    };

    run();
    // Chỉ phụ thuộc subtotal + availablePromotions (không phụ thuộc appliedPromotion
    // để tránh chặn khi đang có mã cũ)
  }, [subtotal, availablePromotions]);

  const orderPromoOptions: AvailablePromotion[] =
    availablePromotions?.orderPromotions ?? [];

  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number,
  ) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(productId, newQuantity);
      if (appliedPromotion) {
        clearPromotion();
        setPromoCode("");
        toast.info(
          "Đơn hàng thay đổi, vui lòng áp dụng lại mã khuyến mãi nếu có.",
        );
      }
    } catch {
      toast.error("Lỗi khi cập nhật số lượng");
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeFromCart(productId);
      if (appliedPromotion) {
        clearPromotion();
        setPromoCode("");
      }
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch {
      toast.error("Lỗi khi xóa sản phẩm");
    }
  };

  const handleApplyPromo = async (codeOverride?: string) => {
    const code = codeOverride || promoCode;

    if (!code?.trim()) {
      toast.error("Vui lòng nhập mã khuyến mãi");
      return;
    }
    if (subtotal === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }
    try {
      setApplyingPromo(true);
      await applyPromotion(code.trim().toUpperCase(), subtotal);
      toast.success(`Đã áp dụng mã ${code.trim().toUpperCase()}`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Mã khuyến mãi không hợp lệ",
      );
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleSelectOrderPromo = async (promo: AvailablePromotion) => {
    setShowPromoDropdown(false);
    if (subtotal === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }
    if (promo.minOrderValue && subtotal < promo.minOrderValue) {
      toast.error(
        `Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString("vi-VN")}đ để dùng khuyến mãi này`,
      );
      return;
    }
    try {
      setApplyingPromo(true);
      await applyPromotionById(promo, subtotal);
      setPromoCode(promo.promotion.code);
      toast.success(`Đã áp dụng: ${promo.promotion.title}`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể áp dụng khuyến mãi",
      );
    } finally {
      setApplyingPromo(false);
    }
  };

  const formatDiscount = (promo: AvailablePromotion) => {
    const p = promo.promotion;
    if (p.discountType === "percentage") {
      return `Giảm ${p.discountValue}%${
        p.maxDiscountAmount
          ? ` (tối đa ${p.maxDiscountAmount.toLocaleString("vi-VN")}đ)`
          : ""
      }`;
    }
    return `Giảm ${p.discountValue.toLocaleString("vi-VN")}đ`;
  };

  if (loading && (!cart || cart.items.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 bg-gray-200 rounded-xl" />
            <div className="h-32 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#b51c00]">
          <ShoppingCart className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="text-gray-500 mb-8">
          Hãy thêm món ăn ngon vào giỏ hàng ngay nhé!
        </p>
        <button
          onClick={() => navigate("/products")}
          className="bg-[#b51c00] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#8e1400] transition shadow-md shadow-red-100 cursor-pointer"
        >
          Tiếp tục chọn món
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Giỏ hàng
        </h1>
        <span className="bg-[#b51c00] text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
          {cartLength} món
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Danh sách sản phẩm */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.productId._id}
              className="bg-white border border-gray-100 rounded-xl p-4 flex gap-4 shadow-sm"
            >
              <img
                src={item.productId.images[0] || "/placeholder.png"}
                alt={item.productId.name}
                className="w-24 h-24 object-cover rounded-lg bg-gray-50 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-2">
                    {item.productId.name}
                  </h3>
                  <button
                    onClick={() => handleRemove(item.productId._id)}
                    className="text-gray-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Giá với Flash Sale badge */}
                <div className="mt-1">
                  {item.price < item.productId.price ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[#b51c00] font-bold">
                        {item.price.toLocaleString("vi-VN")}đ
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        {item.productId.price.toLocaleString("vi-VN")}đ
                      </span>
                      <span className="text-[10px] bg-[#b51c00] text-white px-1.5 py-0.5 rounded font-bold">
                        SALE
                      </span>
                    </div>
                  ) : (
                    <p className="text-[#b51c00] font-bold">
                      {item.price.toLocaleString("vi-VN")}đ
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                    <button
                      onClick={() =>
                        handleUpdateQuantity(
                          item.productId._id,
                          item.quantity - 1,
                        )
                      }
                      disabled={item.quantity <= 1}
                      className="p-1.5 hover:text-[#b51c00] disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-[18px] h-[18px]" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleUpdateQuantity(
                          item.productId._id,
                          item.quantity + 1,
                        )
                      }
                      disabled={item.quantity >= item.productId.stock}
                      className="p-1.5 hover:text-[#b51c00] disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                  <span className="font-bold text-gray-900">
                    {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            </div>
          ))}

          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-[#b51c00] font-bold hover:text-[#8e1400] transition-colors mt-4 px-2"
          >
            <PlusCircle className="w-5 h-5" />
            Chọn thêm món khác
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-50">
              Chi tiết đơn hàng
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Tạm tính</span>
                <span className="font-semibold">
                  {subtotal.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Phí vận chuyển</span>
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

              <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-gray-900 font-bold">Tổng cộng</span>
                <span className="text-xl font-bold text-[#b51c00]">
                  {total.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {/* PROMO SECTION */}
            <div className="mb-5 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã khuyến mãi"
                  className="w-full h-11 pl-4 pr-24 rounded-xl border border-gray-200 bg-white focus:border-[#b51c00] focus:ring-1 focus:ring-[#b51c00] outline-none transition-colors text-sm"
                  disabled={applyingPromo}
                />
                <button
                  onClick={() => handleApplyPromo()}
                  disabled={applyingPromo || !promoCode.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 cursor-pointer"
                >
                  {applyingPromo ? "..." : "Áp dụng"}
                </button>
              </div>

              {orderPromoOptions.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowPromoDropdown((v) => !v)}
                    disabled={applyingPromo}
                    className="w-full p-3 rounded-xl border border-dashed border-[#b51c00]/50 bg-red-50/40 text-[#b51c00] font-medium text-sm text-left flex items-center justify-between hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="w-[18px] h-[18px] shrink-0" />
                      <span className="truncate">
                        {appliedPromotion?.type === "orderPromotion"
                          ? appliedPromotion.title
                          : `${orderPromoOptions.length} ưu đãi đơn hàng`}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-[18px] h-[18px] shrink-0 transition-transform duration-200 ${
                        showPromoDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showPromoDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowPromoDropdown(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Ưu đãi đơn hàng
                          </p>
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                          {orderPromoOptions.map((promo) => {
                            const meetsMin =
                              !promo.minOrderValue ||
                              subtotal >= promo.minOrderValue;
                            const isActive =
                              appliedPromotion?.code === promo.promotion.code;
                            return (
                              <button
                                key={promo.orderPromotionId}
                                onClick={() => handleSelectOrderPromo(promo)}
                                disabled={!meetsMin}
                                className={`w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-50 last:border-0 ${
                                  isActive ? "bg-green-50" : ""
                                }`}
                              >
                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                                  {isActive ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Tag className="w-4 h-4 text-[#b51c00]" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-semibold truncate ${
                                      isActive
                                        ? "text-green-700"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {promo.promotion.title}
                                  </p>
                                  <p className="text-xs text-[#b51c00] font-medium">
                                    {formatDiscount(promo)}
                                  </p>
                                  {promo.minOrderValue && (
                                    <p
                                      className={`text-xs mt-0.5 ${
                                        meetsMin
                                          ? "text-gray-400"
                                          : "text-orange-500 font-medium"
                                      }`}
                                    >
                                      {meetsMin
                                        ? `Đơn tối thiểu ${promo.minOrderValue.toLocaleString("vi-VN")}đ ✓`
                                        : `Cần thêm ${(promo.minOrderValue - subtotal).toLocaleString("vi-VN")}đ nữa`}
                                    </p>
                                  )}
                                </div>
                                {isActive && (
                                  <span className="shrink-0 text-xs text-green-600 font-bold mt-0.5">
                                    Đang dùng
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setShowPromoDropdown(false);
                              navigate("/vouchers");
                            }}
                            className="text-xs text-[#b51c00] font-medium hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            Xem tất cả ưu đãi của bạn →
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {appliedPromotion && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-green-800">
                        {appliedPromotion.title}
                      </p>
                      <p className="text-xs text-green-600">
                        Mã: {appliedPromotion.code} · Giảm{" "}
                        {appliedPromotion.discountAmount.toLocaleString(
                          "vi-VN",
                        )}
                        đ
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      clearPromotion();
                      setPromoCode("");
                    }}
                    className="text-green-600 hover:text-green-800 cursor-pointer"
                  >
                    <X className="w-[18px] h-[18px]" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-[#b51c00] text-white py-3.5 rounded-xl font-bold hover:bg-[#8e1400] transition shadow-md shadow-red-100 active:scale-[0.98] cursor-pointer"
            >
              Tiến hành thanh toán
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-4 italic">
              * Giá đã bao gồm thuế VAT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

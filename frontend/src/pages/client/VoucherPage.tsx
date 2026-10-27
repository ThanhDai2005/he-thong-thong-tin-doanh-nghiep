import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePromotionStore } from "@/stores/usePromotionStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import type { CollectibleVoucher } from "@/types/store";

// ─── Tiện ích ─────────────────────────────────────────────
const formatDiscount = (
  discountType: "percentage" | "fixed",
  discountValue: number,
  maxDiscountAmount: number | null,
) => {
  if (discountType === "percentage") {
    return {
      main: `${discountValue}%`,
      sub: maxDiscountAmount
        ? `Tối đa ${maxDiscountAmount.toLocaleString("vi-VN")}đ`
        : "Không giới hạn",
    };
  }
  return {
    main: `${discountValue.toLocaleString("vi-VN")}đ`,
    sub: "Giảm trực tiếp",
  };
};

const getDaysLeft = (endDate: string) => {
  const diff = new Date(endDate).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return { label: "Hết hạn", urgent: true };
  if (days === 1) return { label: "Hết hạn hôm nay", urgent: true };
  if (days <= 3) return { label: `Còn ${days} ngày`, urgent: true };
  return { label: `Còn ${days} ngày`, urgent: false };
};

// ─── VoucherCard ──────────────────────────────────────────
const VoucherCard = ({
  item,
  onCollect,
  collecting,
}: {
  item: CollectibleVoucher;
  onCollect: (id: string) => void;
  collecting: boolean;
}) => {
  const { promotion, isCollected } = item;
  const discount = formatDiscount(
    promotion.discountType,
    promotion.discountValue,
    promotion.maxDiscountAmount,
  );
  const deadline = getDaysLeft(promotion.endDate);

  return (
    <div
      className={`relative bg-white rounded-2xl overflow-hidden shadow-sm border transition-all duration-200 group ${
        isCollected
          ? "border-green-200 opacity-80"
          : "border-gray-100 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          isCollected ? "bg-green-400" : "bg-[#b51c00]"
        }`}
      />

      {/* Notch left */}
      <div className="absolute left-[calc(35%-1px)] top-0 bottom-0 flex flex-col justify-between pointer-events-none">
        <div className="w-4 h-4 rounded-full bg-gray-50 -translate-x-1/2 -mt-2 border border-gray-100" />
        <div className="flex-1 border-l border-dashed border-gray-200 mx-auto w-0" />
        <div className="w-4 h-4 rounded-full bg-gray-50 -translate-x-1/2 -mb-2 border border-gray-100" />
      </div>

      <div className="flex pl-4">
        {/* Left: discount value */}
        <div
          className={`w-[35%] flex flex-col items-center justify-center py-5 pr-4 ${
            isCollected ? "text-green-600" : "text-[#b51c00]"
          }`}
        >
          <p className="text-2xl font-black leading-none">{discount.main}</p>
          <p className="text-xs font-medium text-center mt-1 opacity-80">
            {discount.sub}
          </p>
        </div>

        {/* Right: info + button */}
        <div className="flex-1 py-4 pr-4 pl-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                {promotion.title}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[12px]">
                    schedule
                  </span>
                  {deadline.label}
                </span>
                {promotion.usageLimit && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[12px]">
                      group
                    </span>
                    {promotion.usageLimit - (promotion.usedCount || 0)} lượt còn lại
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px] text-gray-400 font-mono tracking-wider">
              {promotion.code}
            </p>
            {isCollected ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                <span className="material-symbols-outlined text-[14px]">
                  check_circle
                </span>
                Đã lưu
              </span>
            ) : (
              <button
                onClick={() => onCollect(promotion._id)}
                disabled={collecting}
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#b51c00] hover:bg-[#8e1400] active:scale-95 px-3 py-1.5 rounded-lg transition-all disabled:opacity-60 cursor-pointer"
              >
                {collecting ? (
                  <span className="material-symbols-outlined text-[14px] animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[14px]">
                    add
                  </span>
                )}
                Lưu ngay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MyVoucherCard (Voucher đã lưu trong ví) ─────────────
const MyVoucherCard = ({
  item,
  onUse,
}: {
  item: CollectibleVoucher;
  onUse: () => void;
}) => {
  const { promotion } = item;
  const discount = formatDiscount(
    promotion.discountType,
    promotion.discountValue,
    promotion.maxDiscountAmount,
  );
  const deadline = getDaysLeft(promotion.endDate);

  return (
    <div className="relative bg-gradient-to-r from-[#b51c00]/5 to-white rounded-2xl overflow-hidden border border-[#b51c00]/20 shadow-sm">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#b51c00]" />
      <div className="flex pl-4">
        <div className="w-[35%] flex flex-col items-center justify-center py-5 pr-4 text-[#b51c00]">
          <p className="text-2xl font-black leading-none">{discount.main}</p>
          <p className="text-xs font-medium text-center mt-1 opacity-80">
            {discount.sub}
          </p>
        </div>
        <div className="flex-1 py-4 pr-4 pl-5 border-l border-dashed border-[#b51c00]/20">
          <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
            {promotion.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                deadline.urgent
                  ? "bg-red-50 text-red-600"
                  : "bg-orange-50 text-orange-600"
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">
                schedule
              </span>
              {deadline.label}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px] text-gray-400 font-mono tracking-wider">
              {promotion.code}
            </p>
            <button
              onClick={onUse}
              className="text-xs font-bold text-[#b51c00] border border-[#b51c00] hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Dùng ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── VoucherPage ──────────────────────────────────────────
const VoucherPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    collectibleVouchers,
    loading,
    collectLoading,
    getCollectibleVouchers,
    collectVoucher,
  } = usePromotionStore();

  const [tab, setTab] = useState<"all" | "mine">("all");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    getCollectibleVouchers().catch(() => {});
  }, [getCollectibleVouchers]);

  const handleCollect = async (promotionId: string) => {
    try {
      await collectVoucher(promotionId);
      toast.success("Đã lưu voucher vào ví của bạn!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể lưu voucher",
      );
    }
  };

  const handleUseVoucher = (code: string) => {
    // Lưu code vào localStorage để CartPage tự động apply
    localStorage.setItem("autoApplyPromoCode", code);
    navigate("/cart");
  };

  const myVouchers = collectibleVouchers.filter((v) => v.isCollected);
  const allVouchers = collectibleVouchers;

  const displayed = tab === "mine" ? myVouchers : allVouchers;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-[#b51c00] via-[#c0392b] to-[#922b21] overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/3" />
          {/* Floating voucher icons */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute text-white/10"
              style={{
                top: `${15 + i * 13}%`,
                left: `${5 + i * 16}%`,
                fontSize: "40px",
                transform: `rotate(${-20 + i * 8}deg)`,
              }}
            >
              🎫
            </div>
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-10 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <span className="material-symbols-outlined text-yellow-300 text-[18px]">
              stars
            </span>
            Ưu đãi dành cho bạn
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            Kho Voucher Đặc Sản Ba Miền
          </h1>
          <p className="text-white/80 text-base">
            Lưu ngay — dùng khi thanh toán để tiết kiệm hơn nữa!
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-black">{allVouchers.length}</p>
              <p className="text-xs text-white/70 mt-0.5">Voucher đang có</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-black">{myVouchers.length}</p>
              <p className="text-xs text-white/70 mt-0.5">Đã lưu</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-black">
                {allVouchers.length - myVouchers.length}
              </p>
              <p className="text-xs text-white/70 mt-0.5">Chưa lưu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tab bar */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
          <button
            onClick={() => setTab("all")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              tab === "all"
                ? "bg-[#b51c00] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              card_giftcard
            </span>
            Tất cả ưu đãi
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                tab === "all"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {allVouchers.length}
            </span>
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              tab === "mine"
                ? "bg-[#b51c00] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              wallet
            </span>
            Ví voucher của tôi
            {myVouchers.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  tab === "mine"
                    ? "bg-white/20 text-white"
                    : "bg-red-100 text-[#b51c00]"
                }`}
              >
                {myVouchers.length}
              </span>
            )}
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && displayed.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[40px] text-[#b51c00]">
                {tab === "mine" ? "wallet" : "card_giftcard"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {tab === "mine"
                ? "Ví voucher đang trống"
                : "Chưa có voucher nào"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {tab === "mine"
                ? "Hãy chuyển sang tab Tất cả ưu đãi để lưu voucher về ví nhé!"
                : "Hệ thống đang cập nhật các ưu đãi mới, quay lại sau bạn nhé!"}
            </p>
            {tab === "mine" && (
              <button
                onClick={() => setTab("all")}
                className="bg-[#b51c00] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#8e1400] transition cursor-pointer"
              >
                Xem tất cả ưu đãi
              </button>
            )}
          </div>
        )}

        {/* Voucher list */}
        {!loading && displayed.length > 0 && (
          <>
            {tab === "all" && (
              <div className="space-y-3">
                {displayed.map((item) => (
                  <VoucherCard
                    key={item.promotion._id}
                    item={item}
                    onCollect={handleCollect}
                    collecting={collectLoading}
                  />
                ))}
              </div>
            )}

            {tab === "mine" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="material-symbols-outlined text-blue-500">
                    info
                  </span>
                  <p className="text-sm text-blue-700">
                    Voucher trong ví sẽ tự động hiển thị khi bạn thanh toán.
                    Bạn cũng có thể nhập mã thủ công ở trang giỏ hàng.
                  </p>
                </div>
                {displayed.map((item) => (
                  <MyVoucherCard
                    key={item.promotion._id}
                    item={item}
                    onUse={() => handleUseVoucher(item.promotion.code)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Bottom CTA */}
        {!loading && (
          <div className="mt-8 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900">Đặt hàng ngay thôi!</p>
              <p className="text-sm text-gray-500">
                Áp dụng voucher khi thanh toán để tiết kiệm.
              </p>
            </div>
            <button
              onClick={() => navigate("/products")}
              className="shrink-0 bg-[#b51c00] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#8e1400] transition shadow-sm shadow-red-100 cursor-pointer"
            >
              Chọn món ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoucherPage;

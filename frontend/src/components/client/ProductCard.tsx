import { useState } from "react";
import { useNavigate } from "react-router";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  onQuickAdd?: (product: Product) => Promise<void>;
}

const ProductCard = ({ product, onQuickAdd }: ProductCardProps) => {
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);

  const handleCardClick = () => {
    navigate(`/product/${product.slug}`);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onQuickAdd || product.stock === 0) return;

    try {
      setIsAdding(true);
      await onQuickAdd(product);
    } finally {
      setIsAdding(false);
    }
  };

  // Helper tính giá sau giảm
  const calcDiscountedPrice = (
    price: number,
    discountType: "percentage" | "fixed",
    discountValue: number,
    maxDiscountAmount: number | null,
  ): number => {
    let discount = 0;
    if (discountType === "percentage") {
      discount = (price * discountValue) / 100;
      if (maxDiscountAmount && discount > maxDiscountAmount) {
        discount = maxDiscountAmount;
      }
    } else {
      discount = discountValue;
    }
    return Math.max(0, Math.round(price - discount));
  };

  const promo = product.activePromotion;
  const discountedPrice = promo
    ? calcDiscountedPrice(
        product.price,
        promo.discountType,
        promo.discountValue,
        promo.maxDiscountAmount,
      )
    : null;

  // Tính % giảm để hiện badge
  const discountPercent =
    promo && discountedPrice !== null
      ? Math.round(((product.price - discountedPrice) / product.price) * 100)
      : 0;

  return (
    <article
      onClick={handleCardClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col group border border-transparent hover:border-[#b51c00]/30 hover:shadow-md transition-all duration-300 cursor-pointer relative"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        <img
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={product.images[0] || "/placeholder.png"}
        />

        {/* Flash Sale Badge */}
        {promo && discountPercent > 0 && product.stock > 0 && (
          <div className="absolute top-3 left-3 bg-[#b51c00] text-white text-[11px] font-black px-2 py-0.5 rounded-md shadow-md flex items-center gap-0.5 uppercase tracking-wide">
            <span
              className="material-symbols-outlined text-[13px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
            -{discountPercent}%
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
          <span
            className="material-symbols-outlined text-yellow-500 text-[14px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
          <span className="text-xs font-bold text-gray-900">
            {product.averageRating.toFixed(1)}
          </span>
        </div>

        {/* Out of Stock Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-gray-900 px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-widest shadow-lg">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm md:text-base font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#b51c00] transition-colors mb-2">
          {product.name}
        </h3>

        {/* Footer: Price + Add Button */}
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            {/* Giá sau giảm */}
            <span className="text-base md:text-lg font-black text-[#b51c00]">
              {(discountedPrice ?? product.price).toLocaleString("vi-VN")}đ
            </span>
            {/* Giá gốc gạch ngang */}
            {promo &&
              discountedPrice !== null &&
              discountedPrice < product.price && (
                <span className="text-xs text-gray-400 line-through">
                  {product.price.toLocaleString("vi-VN")}đ
                </span>
              )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={product.stock === 0 || isAdding}
            className="w-9 h-9 rounded-full bg-red-50 text-[#b51c00] flex items-center justify-center hover:bg-[#b51c00] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 active:scale-90"
          >
            {isAdding ? (
              <span className="material-symbols-outlined text-[20px] animate-spin">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-[22px]">
                add_shopping_cart
              </span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;

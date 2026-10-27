import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useProductStore } from "@/stores/useProductStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useReviewStore } from "@/stores/useReviewStore";
import type { Product } from "@/types/product";
import { toast } from "sonner";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import ReviewSection from "@/components/client/ReviewSection";
import ProductCard from "@/components/client/ProductCard";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<"desc" | "reviews">("desc");
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [notableProducts, setNotableProducts] = useState<Product[]>([]);

  const { accessToken } = useAuthStore();
  const { currentProduct, loading, getDetail, getList } = useProductStore();
  const { addToCart } = useCartStore();
  const { getReviewsByProduct, resetReviews, reviews } = useReviewStore();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        // Reset reviews khi vào trang mới
        resetReviews();

        // Fetch main product
        const res = await getDetail(slug);

        if (res.data?._id) {
          // Parallel fetch reviews, related, and notable products
          const [, relatedRes, notableRes] = await Promise.all([
            getReviewsByProduct(res.data._id).catch(() => ({ data: [] })),
            res.data.categoryId?.slug
              ? getList(
                  "",
                  res.data.categoryId.slug,
                  1,
                  5,
                  "averageRating",
                  "-1",
                ).catch(() => ({ data: [] }))
              : Promise.resolve({ data: [] }),
            getList("", "", 1, 3, "averageRating", "-1").catch(() => ({
              data: [],
            })),
          ]);

          // Filter out current product from related
          if (relatedRes.data) {
            const filtered = relatedRes.data.filter(
              (p: Product) => p._id !== res.data._id,
            );
            setRelatedProducts(filtered.slice(0, 4));
          }

          setNotableProducts(notableRes.data || []);

          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi khi tải sản phẩm");
        navigate("/");
      }
    };

    fetchProduct();
  }, [slug, getDetail, getReviewsByProduct, getList, navigate, resetReviews]);

  const handleAddToCart = async () => {
    if (!accessToken) {
      toast.warning("Vui lòng đăng nhập để thêm vào giỏ hàng");
      navigate("/signin");
      return;
    }

    if (!currentProduct) return;
    if (quantity > currentProduct.stock) {
      toast.error("Số lượng vượt quá tồn kho");
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(currentProduct._id, quantity);
      toast.success("Đã thêm vào giỏ hàng");
      setQuantity(1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm vào giỏ hàng");
    } finally {
      setAddingToCart(false);
    }
  };

  const decreaseQuantity = () => quantity > 1 && setQuantity(quantity - 1);
  const increaseQuantity = () =>
    currentProduct &&
    quantity < currentProduct.stock &&
    setQuantity(quantity + 1);

  const handleQuickAdd = async (item: Product) => {
    if (!accessToken) {
      toast.warning("Vui lòng đăng nhập để thêm vào giỏ hàng");
      navigate("/signin");
      return;
    }

    if (item.stock === 0) return;

    try {
      await addToCart(item._id, 1);
      toast.success(`Đã thêm ${item.name} vào giỏ hàng`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const SERVICES = [
    {
      icon: "local_shipping",
      title: "Giao hàng nhanh",
      desc: "Giao hàng trong 30 phút",
    },
    {
      icon: "verified_user",
      title: "An toàn vệ sinh",
      desc: "Đảm bảo chất lượng",
    },
    {
      icon: "schedule",
      title: "Mở cửa 7/7",
      desc: "Phục vụ 7:00 – 22:00",
    },
    {
      icon: "support_agent",
      title: "Hỗ trợ 24/7",
      desc: "Đội ngũ chuyên nghiệp",
    },
  ];

  if (loading) {
    return (
      <div className="chitietSP pt-20 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* MAIN CONTENT */}
            <div className="lg:col-span-9">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-10">
                {/* Image Skeleton */}
                <div className="md:col-span-2">
                  <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-200 aspect-[4/3] animate-pulse" />
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-gray-200 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                </div>

                {/* Info Skeleton */}
                <div className="md:col-span-3 space-y-6">
                  <div className="h-9 bg-gray-200 rounded w-3/4 animate-pulse" />

                  <div className="flex gap-4">
                    <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
                  </div>

                  <div className="h-12 bg-gray-200 rounded w-48 animate-pulse" />

                  <div className="space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-full animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-full animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-11/12 animate-pulse" />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-14 w-40 bg-gray-200 rounded-xl animate-pulse" />
                    <div className="h-14 flex-1 bg-gray-300 rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Tabs Skeleton */}
              <div className="mt-12">
                <div className="flex border-b border-gray-200 pb-4">
                  <div className="h-8 w-24 bg-gray-200 rounded mr-8 animate-pulse" />
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                </div>

                <div className="mt-8 border border-gray-200 rounded-2xl p-8 space-y-10">
                  <div className="space-y-4">
                    <div className="h-7 bg-gray-200 rounded w-48 animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-full animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-full animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR SKELETON */}
            <div className="lg:col-span-3 space-y-8">
              {/* Services */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Notable Products */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="h-12 bg-red-600 animate-pulse" />
                <div className="p-4 space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded animate-pulse" />
                      <div className="flex-1 space-y-3 pt-2">
                        <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Skeleton */}
          <div className="mt-16">
            <div className="flex justify-center mb-8">
              <div className="h-12 w-80 bg-gray-200 rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border rounded-2xl overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 bg-gray-200 rounded w-28 animate-pulse" />
                    <div className="h-10 bg-gray-300 rounded-xl animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProduct) return null;

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

  const promo = currentProduct.activePromotion;
  const discountedPrice = promo
    ? calcDiscountedPrice(
        currentProduct.price,
        promo.discountType,
        promo.discountValue,
        promo.maxDiscountAmount,
      )
    : null;

  const discountPercent =
    promo && discountedPrice !== null
      ? Math.round(
          ((currentProduct.price - discountedPrice) / currentProduct.price) *
            100,
        )
      : 0;

  return (
    <div className="chitietSP pt-20 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* ==================== MAIN CONTENT ==================== */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-10">
              {/* LEFT - IMAGE */}
              <div className="md:col-span-2">
                <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100">
                  <Swiper
                    spaceBetween={10}
                    navigation
                    thumbs={
                      thumbsSwiper && !thumbsSwiper.destroyed
                        ? { swiper: thumbsSwiper }
                        : undefined
                    }
                    modules={[FreeMode, Navigation, Thumbs]}
                    className="w-full product-detail-swiper"
                  >
                    {currentProduct.images.map((img, idx) => (
                      <SwiperSlide key={idx}>
                        <img
                          src={img}
                          alt={`${currentProduct.name} - Ảnh ${idx + 1}`}
                          className="w-full aspect-4/3 object-cover"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>

                {currentProduct.images.length > 1 && (
                  <Swiper
                    onSwiper={setThumbsSwiper}
                    spaceBetween={10}
                    slidesPerView={4}
                    freeMode={true}
                    watchSlidesProgress={true}
                    modules={[FreeMode, Thumbs]}
                    className="mt-4 product-thumbs-swiper"
                  >
                    {currentProduct.images.map((img, idx) => (
                      <SwiperSlide key={idx} className="cursor-pointer">
                        <img
                          src={img}
                          className="rounded-xl aspect-square object-cover border-2 border-transparent hover:border-red-500 transition-colors"
                          alt={`Thumbnail ${idx + 1}`}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )}
              </div>

              {/* RIGHT - PRODUCT INFO */}
              <div className="md:col-span-3">
                <h1 className="text-3xl font-bold mb-3">
                  {currentProduct.name}
                </h1>

                <div className="flex items-center gap-5 mb-4">
                  <div className="flex items-center gap-1 bg-yellow-50 px-4 py-2 rounded-full">
                    <span
                      className="material-symbols-outlined text-yellow-500 text-2xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="font-bold text-xl">
                      {(currentProduct.averageRating ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {currentProduct.numReviews} đánh giá
                  </span>
                </div>

                {/* === PRICE SECTION WITH FLASH SALE === */}
                <div className="mb-6">
                  {!promo || discountedPrice === null ? (
                    <div className="text-4xl font-bold text-red-600 mb-6">
                      {(currentProduct.price ?? 0).toLocaleString("vi-VN")} ₫
                    </div>
                  ) : (
                    <div>
                      {/* Flash Sale Banner */}
                      <div className="inline-flex items-center gap-2 bg-[#b51c00] text-white px-3 py-1.5 rounded-lg mb-3 text-sm font-bold shadow-sm">
                        <span
                          className="material-symbols-outlined text-[16px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          bolt
                        </span>
                        FLASH SALE · Giảm {discountPercent}%
                      </div>
                      {/* Giá giảm */}
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold text-red-600">
                          {discountedPrice.toLocaleString("vi-VN")} ₫
                        </span>
                        <span className="text-xl text-gray-400 line-through font-medium">
                          {(currentProduct.price ?? 0).toLocaleString("vi-VN")}{" "}
                          ₫
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Kết thúc:{" "}
                        {new Date(promo.endDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-gray-600 leading-relaxed mb-8 text-[15px]">
                  {currentProduct.description}
                </div>

                {/* Quantity */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center bg-white border border-gray-200 rounded-xl h-14 w-full sm:w-auto">
                    <button
                      onClick={decreaseQuantity}
                      className="w-14 h-full flex items-center justify-center hover:text-[#b51c00] hover:bg-gray-50 rounded-l-xl transition disabled:opacity-30"
                      disabled={quantity <= 1}
                    >
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    <span className="w-12 text-center font-bold text-lg">
                      {quantity}
                    </span>
                    <button
                      onClick={increaseQuantity}
                      className="w-14 h-full flex items-center justify-center hover:text-[#b51c00] hover:bg-gray-50 rounded-r-xl transition disabled:opacity-30"
                      disabled={quantity >= currentProduct.stock}
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || currentProduct.stock === 0}
                    className="flex-1 w-full h-14 bg-[#b51c00] text-white rounded-xl font-bold text-lg hover:bg-[#8e1400] transition-all shadow-md shadow-red-100 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {addingToCart ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[20px]">
                          progress_activity
                        </span>
                        Đang thêm...
                      </>
                    ) : currentProduct.stock === 0 ? (
                      "HẾT HÀNG"
                    ) : (
                      <>
                        <span className="material-symbols-outlined">
                          shopping_bag
                        </span>
                        Thêm vào giỏ
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* TABS */}
            <div className="mt-12">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("desc")}
                  className={`pb-4 px-8 font-semibold text-lg ${
                    activeTab === "desc"
                      ? "border-b-4 border-red-600 text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  Mô tả
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`pb-4 px-8 font-semibold text-lg ${
                    activeTab === "reviews"
                      ? "border-b-4 border-red-600 text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  Đánh giá ({reviews.length})
                </button>
              </div>

              {/* DESCRIPTION CONTENT */}
              {activeTab === "desc" && (
                <div className="mt-8 border border-gray-200 rounded-2xl p-6 md:p-8">
                  {currentProduct.ingredients ? (
                    <div
                      className="ingredients-content"
                      dangerouslySetInnerHTML={{
                        __html: currentProduct.ingredients,
                      }}
                    />
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-bold mb-4 text-gray-900">
                          Mô tả sản phẩm
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                          {currentProduct.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* REVIEWS */}
              {activeTab === "reviews" && (
                <ReviewSection productId={currentProduct._id} />
              )}
            </div>
          </div>

          {/* ==================== RIGHT SIDEBAR ==================== */}
          <div className="lg:col-span-3 space-y-8">
            {/* SERVICES */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              {SERVICES.map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#b51c00]/30 transition-colors"
                >
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#b51c00]">
                      {icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight truncate">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* SẢN PHẨM NỔI BẬT */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-red-600 text-white text-center py-3 font-bold text-lg">
                SẢN PHẨM NỔI BẬT
              </div>
              <div className="p-4 space-y-4">
                {notableProducts.length > 0 ? (
                  notableProducts.map((product) => {
                    // Tính giá sau giảm cho sản phẩm nổi bật
                    const promo = product.activePromotion;
                    const finalPrice = promo
                      ? calcDiscountedPrice(
                          product.price,
                          promo.discountType,
                          promo.discountValue,
                          promo.maxDiscountAmount,
                        )
                      : product.price;

                    return (
                      <div
                        key={product._id}
                        onClick={() => navigate(`/product/${product.slug}`)}
                        className="flex gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      >
                        <div className="relative">
                          <img
                            src={product.images[0] || "/placeholder.png"}
                            className="w-20 h-20 object-cover rounded-lg"
                            alt={product.name}
                          />
                          {promo && (
                            <div className="absolute -top-1 -right-1 bg-[#b51c00] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <span
                                className="material-symbols-outlined text-[10px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                bolt
                              </span>
                              -
                              {Math.round(
                                ((product.price - finalPrice) / product.price) *
                                  100,
                              )}
                              %
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm line-clamp-2 mb-1">
                            {product.name}
                          </div>
                          <div className="flex items-baseline gap-2">
                            <div className="text-red-600 font-bold text-base">
                              {finalPrice.toLocaleString("vi-VN")} ₫
                            </div>
                            {promo && finalPrice < product.price && (
                              <div className="text-gray-400 text-xs line-through">
                                {product.price.toLocaleString("vi-VN")} ₫
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span
                              className="material-symbols-outlined text-yellow-500"
                              style={{
                                fontSize: "14px",
                                fontVariationSettings: "'FILL' 1",
                              }}
                            >
                              star
                            </span>
                            <span className="text-xs text-gray-600">
                              {(product.averageRating ?? 0).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-6 text-gray-500 text-sm">
                    Đang cập nhật...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== SẢN PHẨM LIÊN QUAN ==================== */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <div className="inline-block bg-red-600 text-white px-10 py-3 rounded-full font-bold text-lg">
                SẢN PHẨM LIÊN QUAN
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item._id}
                  product={item}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useProductStore } from "@/stores/useProductStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useCartStore } from "@/stores/useCartStore"; // Import store giỏ hàng
import { toast } from "sonner"; // Dùng sonner cho đồng bộ
import type { Product } from "@/types/product";
import { useAuthStore } from "@/stores/useAuthStore";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

// Hàm Helper ánh xạ icon theo slug danh mục chuẩn UX
const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case "mon-lau":
      return "ramen_dining"; // Lẩu/Mì
    case "nuoc-uong":
      return "local_cafe"; // Nước uống
    case "mon-man":
      return "rice_bowl"; // Món mặn/Cơm
    case "hai-san":
      return "set_meal"; // Hải sản/Cá
    case "mon-an-vat":
      return "tapas"; // Ăn vặt
    case "mon-chay":
      return "eco"; // Món chay/Rau xanh
    case "mon-trang-mieng":
      return "icecream"; // Tráng miệng/Kem
    default:
      return "fastfood"; // Mặc định
  }
};

const ProductList = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const { product, loading, getList } = useProductStore();
  const { category, getList: getCategoryList } = useCategoryStore();
  const { addToCart } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState("");

  // Tối ưu: Chỉ gọi API danh mục 1 lần khi mount trang
  useEffect(() => {
    getCategoryList();
  }, []);

  // Gọi API lấy sản phẩm mỗi khi đổi danh mục
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        await getList("", selectedCategory, 1, 8, "averageRating", "-1");
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
      }
    };
    fetchProducts();
  }, [selectedCategory]);

  // Luồng Quick Add to Cart chuẩn Senior
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
    } catch (error) {
      toast.error(error.response?.data?.message);
      console.log(error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full flex-grow mb-16">
      {/* ================= CATEGORIES ================= */}
      <section className="mt-8 px-4 md:px-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Danh mục
          </h2>
          <Link
            to="/products"
            className="text-sm font-semibold text-[#b51c00] hover:text-[#961700] transition-colors flex items-center gap-1"
          >
            Xem tất cả
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </Link>
        </div>

        {/* Vuốt ngang mượt mà ẩn scrollbar */}
        <div className="flex gap-4 overflow-x-auto pt-2 px-2 pb-4 -mt-2 -mx-2 snap-x scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Item "Tất cả" */}
          <div
            onClick={() => setSelectedCategory("")}
            className="flex-none w-[76px] md:w-[88px] flex flex-col items-center gap-2 snap-start cursor-pointer group"
          >
            <div
              className={`w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl shadow-sm flex items-center justify-center transition-all duration-300 group-hover:scale-105 active:scale-95 ${
                selectedCategory === ""
                  ? "bg-[#b51c00] text-white shadow-[#b51c00]/30"
                  : "bg-white border border-gray-100 text-gray-600 group-hover:border-[#b51c00]/50 group-hover:text-[#b51c00]"
              }`}
            >
              <span
                className="material-symbols-outlined text-[32px] md:text-[36px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                restaurant
              </span>
            </div>
            <span
              className={`text-xs md:text-sm text-center font-bold ${
                selectedCategory === ""
                  ? "text-[#b51c00]"
                  : "text-gray-600 group-hover:text-[#b51c00]"
              }`}
            >
              Tất cả
            </span>
          </div>

          {/* Render Categories từ API (Đã tích hợp hàm lấy Icon tự động) */}
          {category.map((cat) => (
            <div
              key={cat._id}
              onClick={() => setSelectedCategory(cat.slug)}
              className="flex-none w-[76px] md:w-[88px] flex flex-col items-center gap-2 snap-start cursor-pointer group"
            >
              <div
                className={`w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl shadow-sm flex items-center justify-center transition-all duration-300 group-hover:scale-105 active:scale-95 ${
                  selectedCategory === cat.slug
                    ? "bg-[#b51c00] text-white shadow-[#b51c00]/30"
                    : "bg-white border border-gray-100 text-gray-600 group-hover:border-[#b51c00]/50 group-hover:text-[#b51c00]"
                }`}
              >
                {/* Sử dụng hàm ánh xạ icon ở đây */}
                <span className="material-symbols-outlined text-[32px] md:text-[36px]">
                  {getCategoryIcon(cat.slug)}
                </span>
              </div>
              <span
                className={`text-xs md:text-sm text-center font-bold truncate w-full ${
                  selectedCategory === cat.slug
                    ? "text-[#b51c00]"
                    : "text-gray-600 group-hover:text-[#b51c00]"
                }`}
              >
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= POPULAR PRODUCTS ================= */}
      <section className="mt-10 px-4 md:px-6">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-6">
          Món ăn phổ biến
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        ) : product.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">
              search_off
            </span>
            <p className="text-gray-500 font-medium">
              Không tìm thấy món ăn nào trong danh mục này.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {product.map((item: Product) => (
              <ProductCard
                key={item._id}
                product={item}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        )}

        <div className="flex justify-center mt-10">
          <Link
            to="/products"
            className="px-8 py-3 bg-white border-2 border-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:border-[#b51c00] hover:text-[#b51c00] transition-all duration-300 active:scale-95 shadow-sm"
          >
            Xem tất cả thực đơn
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ProductList;

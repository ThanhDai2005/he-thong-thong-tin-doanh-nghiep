import { useParams, Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBlogStore } from "@/stores/useBlogStore";
import { useCartStore } from "@/stores/useCartStore";
import { toast } from "sonner";
import ProductCard from "@/components/client/ProductCard";
import type { Product } from "@/types/product";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { accessToken } = useAuthStore();
  const { currentBlog, loading, getDetail } = useBlogStore();
  const { addToCart } = useCartStore();

  useEffect(() => {
    if (slug) {
      getDetail(slug);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [slug, getDetail]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Đã sao chép liên kết bài viết!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickAdd = async (item: Product) => {
    if (!accessToken) {
      toast.warning("Vui lòng đăng nhập để thêm vào giỏ hàng");
      navigate("/signin");
      return;
    }

    try {
      await addToCart(item._id, 1);
      toast.success(`Đã thêm ${item.name} vào giỏ hàng`);
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-[#b51c00]"></div>
          <p className="text-gray-600 font-medium mt-4">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (!currentBlog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-12 rounded-3xl shadow-sm border border-gray-100">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
            article
          </span>
          <p className="text-gray-900 font-bold text-xl mb-2">
            Không tìm thấy bài viết
          </p>
          <p className="text-gray-500 mb-6">
            Bài viết này có thể đã bị xóa hoặc không tồn tại.
          </p>
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#b51c00] text-white font-bold rounded-xl hover:bg-[#8e1400] transition-colors"
          >
            Quay lại Góc Ẩm Thực
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="relative h-[400px] md:h-[550px] w-full overflow-hidden">
          <img
            src={currentBlog.imageUrl || "/placeholder.png"}
            alt={currentBlog.title}
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        {/* ================= ARTICLE CONTENT ================= */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-32 relative z-10">
          {/* Title Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-8 border border-gray-100">
            <span className="inline-block px-4 py-1.5 bg-red-50 text-[#b51c00] rounded-full text-xs font-bold uppercase tracking-wider mb-5 border border-red-100">
              {currentBlog.blogCategoryId?.name || "Tin Nổi Bật"}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
              {currentBlog.title}
            </h1>
            <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-gray-600 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 font-medium">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-[#b51c00]">
                  <span className="material-symbols-outlined text-[20px]">
                    edit_square
                  </span>
                </div>
                <div>
                  <p className="text-gray-900 font-bold">
                    {currentBlog.authorId?.displayName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(currentBlog.publishedAt).toLocaleDateString(
                      "vi-VN",
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={handleShare}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${
                  copied
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {copied ? "check" : "share"}
                </span>
                {copied ? "Đã sao chép" : "Chia sẻ bài viết"}
              </button>
            </div>
          </div>

          {/* Article Body */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 mb-12">
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: currentBlog.content }}
            />
          </div>

          {/* ================= RELATED PRODUCTS ================= */}
          {currentBlog.relatedProducts &&
            currentBlog.relatedProducts.length > 0 && (
              <div className="bg-white rounded-3xl p-8 md:p-10 mb-12 border border-[#b51c00]/10 shadow-lg shadow-red-900/5">
                <div className="flex items-center justify-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-[#b51c00] text-3xl">
                    restaurant_menu
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center tracking-tight">
                    Thưởng Thức Ngay Các Món Trong Bài
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {currentBlog.relatedProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onQuickAdd={handleQuickAdd}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* Back to Blog */}
          <div className="text-center pb-8">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border border-gray-200 hover:border-[#b51c00] hover:text-[#b51c00] rounded-xl transition-all text-gray-700 font-bold active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">
                arrow_back
              </span>
              Quay lại danh sách bài viết
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogDetailPage;

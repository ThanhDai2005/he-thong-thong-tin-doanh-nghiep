import { useEffect, useRef } from "react";
import { toast } from "sonner";
import Viewer from "viewerjs";
import "viewerjs/dist/viewer.css";
import { useReviewStore } from "@/stores/useReviewStore";

interface ReviewSectionProps {
  productId: string;
}

const ReviewSection = ({ productId }: ReviewSectionProps) => {
  const {
    reviews,
    loading,
    currentPage,
    totalPages,
    getReviewsByProduct,
    loadMoreReviews,
    resetReviews,
  } = useReviewStore();

  const imageGalleryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Reset và load reviews khi đổi sản phẩm
  useEffect(() => {
    resetReviews();
    getReviewsByProduct(productId, 1, 5); // Load 5 đánh giá ban đầu (khuyến nghị)
  }, [productId, resetReviews, getReviewsByProduct]);

  // Initialize Viewer cho ảnh
  useEffect(() => {
    const viewers: { [key: string]: Viewer } = {};

    reviews.forEach((review) => {
      if (review.images?.length > 0) {
        const el = imageGalleryRefs.current[review._id];
        if (el) {
          viewers[review._id] = new Viewer(el, {
            toolbar: { zoomIn: true, zoomOut: true, reset: true },
            navbar: false,
            title: false,
          });
        }
      }
    });

    return () => {
      Object.values(viewers).forEach((v) => v.destroy());
    };
  }, [reviews]);

  const handleLoadMore = async () => {
    if (loading || currentPage >= totalPages) return;

    try {
      await loadMoreReviews(productId, 5);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể tải thêm đánh giá",
      );
    }
  };

  const hasMore = currentPage < totalPages;
  const totalLoaded = reviews.length;

  return (
    <div className="mt-8 space-y-8">
      {totalLoaded > 0 ? (
        <>
          {reviews.map((review) => (
            <div
              key={review._id}
              className="border-b border-gray-200 pb-8 last:border-b-0"
            >
              <div className="flex gap-4">
                <div className="shrink-0">
                  {review.customerId?.userId?.avatarUrl ? (
                    <img
                      src={review.customerId.userId.avatarUrl}
                      alt={review.customerId.userId.displayName}
                      className="w-12 h-12 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {review.customerId?.userId?.displayName?.[0]?.toUpperCase() ||
                        "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-gray-900">
                      {review.customerId?.userId?.displayName ||
                        "Người dùng ẩn danh"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>

                  <div className="flex gap-0.5 my-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-2xl ${
                          i < review.rating
                            ? "text-yellow-400"
                            : "text-gray-200"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {review.comment}
                    </p>
                  )}

                  {review.images?.length > 0 && (
                    <div
                      ref={(el) => {
                        imageGalleryRefs.current[review._id] = el;
                      }}
                      className="flex flex-wrap gap-3 mb-4"
                    >
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Review ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-xl cursor-pointer border border-gray-200 hover:border-red-400 transition-all"
                        />
                      ))}
                    </div>
                  )}

                  {/* Admin Reply */}
                  {review.adminReply?.content && (
                    <div className="mt-4 ml-0 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0">
                          {review.adminReply.repliedBy?.userId?.avatarUrl ? (
                            <img
                              src={review.adminReply.repliedBy.userId.avatarUrl}
                              alt={
                                review.adminReply.repliedBy.userId.displayName
                              }
                              className="w-9 h-9 rounded-full object-cover border-2 border-emerald-300"
                            />
                          ) : (
                            <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              A
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-emerald-900">
                              {review.adminReply.repliedBy?.userId
                                ?.displayName || "Admin"}
                            </p>
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-full font-semibold">
                              {review.adminReply?.repliedBy?.roleId?.title}
                            </span>
                            {review.adminReply.repliedAt && (
                              <span className="text-xs text-emerald-600">
                                ·{" "}
                                {new Date(
                                  review.adminReply.repliedAt,
                                ).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-emerald-900 leading-relaxed">
                            {review.adminReply.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-10 py-3.5 bg-white border-2 border-gray-300 rounded-2xl font-semibold text-gray-700 hover:border-[#b51c00] hover:text-[#b51c00] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">
                      progress_activity
                    </span>
                    Đang tải...
                  </>
                ) : (
                  `Xem thêm đánh giá`
                )}
              </button>
            </div>
          )}

          {!hasMore && totalLoaded > 0 && (
            <p className="text-center text-gray-400 text-sm py-4">
              Đã hiển thị tất cả đánh giá
            </p>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">
            rate_review
          </span>
          <p className="text-gray-600 font-medium">Chưa có đánh giá nào</p>
          <p className="text-gray-400 text-sm mt-1">
            Hãy là người đầu tiên đánh giá sản phẩm này!
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;

import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useOrderStore } from "@/stores/useOrderStore";
import { toast } from "sonner";
import Viewer from "viewerjs";
import "viewerjs/dist/viewer.css";

const OrderReviewsViewPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { orderReviews, loading, getOrderReviews } = useOrderStore();

  const imageGalleryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const fetchOrderReviews = async () => {
      try {
        await getOrderReviews(orderId!);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi khi tải đánh giá");
        navigate("/orders");
      }
    };

    window.scrollTo({ top: 0, behavior: "smooth" });

    fetchOrderReviews();
  }, [orderId, navigate, getOrderReviews]);

  // Initialize viewer for each review's images
  useEffect(() => {
    if (!orderReviews?.reviews) return;

    const viewers: { [key: string]: Viewer } = {};

    orderReviews.reviews.forEach((review) => {
      if (review.images && review.images.length > 0) {
        const galleryElement = imageGalleryRefs.current[review._id];
        if (galleryElement) {
          viewers[review._id] = new Viewer(galleryElement, {
            toolbar: {
              zoomIn: 1,
              zoomOut: 1,
              reset: 1,
              rotateLeft: 1,
              rotateRight: 1,
            },
            navbar: false,
            title: false,
          });
        }
      }
    });

    return () => {
      Object.values(viewers).forEach((viewer) => viewer.destroy());
    };
  }, [orderReviews]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!orderReviews?.order) return null;

  const { order, reviews } = orderReviews;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Đánh giá của bạn</h1>
      </div>

      {/* Order Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <p className="text-sm text-gray-500 mb-2">
          Mã đơn hàng: #{order._id.slice(-8).toUpperCase()}
        </p>
        <p className="text-sm text-gray-500">
          Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
        </p>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map((review) => {
            // Find the product from order items
            const orderItem = order.items.find(
              (item: any) =>
                item.productId._id.toString() === review.productId.toString(),
            );
            const product = orderItem?.productId;

            return (
              <div
                key={review._id}
                className="bg-white rounded-2xl border border-gray-100 p-6"
              >
                {/* Product Info */}
                {product && (
                  <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
                    <img
                      src={product.images[0] || "/placeholder.png"}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-xl bg-gray-50"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Số lượng: x{orderItem.quantity}
                      </p>
                    </div>
                  </div>
                )}

                {/* Review Content */}
                <div className="space-y-4">
                  {/* Rating */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Đánh giá của bạn
                    </p>
                    <div className="flex gap-1">
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
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Nhận xét
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  )}

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Hình ảnh đính kèm
                      </p>
                      <div
                        ref={(el) =>
                          (imageGalleryRefs.current[review._id] = el)
                        }
                        className="flex gap-2 flex-wrap"
                      >
                        {review.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Review image ${idx + 1}`}
                            className="w-24 h-24 object-cover rounded-lg cursor-pointer border border-gray-200 hover:border-red-500 transition-colors"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Date */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Đánh giá vào ngày{" "}
                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <span className="material-symbols-outlined text-gray-300 text-6xl mb-3 block">
              rate_review
            </span>
            <p className="text-gray-500 text-lg">Chưa có đánh giá nào.</p>
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="mt-8">
        <button
          onClick={() => navigate(-1)}
          className="w-full h-12 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition"
        >
          Quay lại danh sách đơn hàng
        </button>
      </div>
    </div>
  );
};

export default OrderReviewsViewPage;

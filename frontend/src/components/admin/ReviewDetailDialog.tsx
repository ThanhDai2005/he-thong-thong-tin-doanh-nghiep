import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  EyeOff,
  Eye,
  Reply,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Review } from "@/types/review";

interface ReviewDetailDialogProps {
  review: Review | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  onReply: (reviewId: string, content: string) => void | Promise<void>;
  onDeleteReply: (reviewId: string) => void | Promise<void>;
  onToggleHidden: (reviewId: string) => void | Promise<void>;
}

const StarRating = ({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={size}
        className={
          s <= rating
            ? "fill-amber-400 text-amber-400"
            : "fill-gray-200 text-gray-200"
        }
      />
    ))}
  </div>
);

const ratingBadgeClass = (rating: number) => {
  if (rating >= 5)
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (rating >= 4) return "bg-green-50 text-green-700 border border-green-200";
  if (rating >= 3)
    return "bg-yellow-50 text-yellow-700 border border-yellow-200";
  if (rating >= 2)
    return "bg-orange-50 text-orange-700 border border-orange-200";
  return "bg-red-50 text-red-700 border border-red-200";
};

const ReviewDetailDialog = ({
  review,
  open,
  onOpenChange,
  canEdit,
  onReply,
  onDeleteReply,
  onToggleHidden,
}: ReviewDetailDialogProps) => {
  const [activeImg, setActiveImg] = useState(0);
  const [replyMode, setReplyMode] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Đổi review → reset form / carousel
  useEffect(() => {
    setReplyMode(false);
    setReplyContent("");
    setActiveImg(0);
    setSubmitting(false);
  }, [review?._id]);

  // Đã có phản hồi → tắt form nhập
  useEffect(() => {
    if (review?.adminReply?.content) {
      setReplyMode(false);
      setReplyContent("");
    }
  }, [review?.adminReply?.content]);

  const handleSubmitReply = async () => {
    if (!review) return;
    if (!replyContent.trim()) {
      toast.error("Nội dung phản hồi không được để trống");
      return;
    }
    try {
      setSubmitting(true);
      await onReply(review._id, replyContent.trim());
      setReplyContent("");
      setReplyMode(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!review) return null;

  const hasReply = Boolean(review.adminReply?.content);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="pl-6 pr-8 py-4 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-[17px] font-bold text-gray-900">
            Chi tiết đánh giá
          </DialogTitle>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => onToggleHidden(review._id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
                  review.isHidden
                    ? "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
                    : "bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100"
                }`}
              >
                {review.isHidden ? (
                  <>
                    <Eye size={13} />
                    Hiện
                  </>
                ) : (
                  <>
                    <EyeOff size={13} />
                    Ẩn
                  </>
                )}
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {review.isHidden && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2">
              <EyeOff size={16} className="text-orange-600" />
              <p className="text-sm text-orange-700 font-medium">
                Đánh giá này đang bị ẩn khỏi khách hàng
              </p>
            </div>
          )}

          {/* Customer */}
          <div className="flex items-start gap-4">
            {review.customerId?.userId?.avatarUrl ? (
              <img
                src={review.customerId.userId.avatarUrl}
                alt={review.customerId.userId.displayName}
                className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#b51c00] to-orange-400 flex items-center justify-center text-white font-bold text-xl shrink-0">
                {review.customerId?.userId?.displayName?.[0]?.toUpperCase() ??
                  "K"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-[15px]">
                {review.customerId?.userId?.displayName ?? "Khách hàng ẩn danh"}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {review.customerId?.userId?.phone ?? "—"} ·{" "}
                {review.customerId?.userId?.email ?? "—"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={review.rating} size={16} />
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ratingBadgeClass(review.rating)}`}
                >
                  {review.rating}/5
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Product */}
          {review.productId && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              {review.productId.images?.[0] ? (
                <img
                  src={review.productId.images[0]}
                  alt={review.productId.name}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  <ImageIcon size={20} className="text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Sản phẩm được đánh giá
                </p>
                <p className="font-semibold text-gray-900 truncate">
                  {review.productId.name}
                </p>
                {review.orderId && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Đơn #{review.orderId._id.slice(-8).toUpperCase()} ·{" "}
                    {new Date(review.orderId.createdAt).toLocaleDateString(
                      "vi-VN",
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Comment */}
          {review.comment ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Nhận xét
              </p>
              <p className="text-gray-700 leading-relaxed bg-blue-50 border border-blue-100 rounded-xl p-4 text-[14px]">
                {review.comment}
              </p>
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400">Không có nhận xét</p>
            </div>
          )}

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Ảnh đính kèm ({review.images.length})
              </p>
              <div className="space-y-3">
                <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={review.images[activeImg]}
                    alt={`Review image ${activeImg + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {review.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImg((prev) =>
                            prev === 0 ? review.images!.length - 1 : prev - 1,
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImg((prev) =>
                            prev === review.images!.length - 1 ? 0 : prev + 1,
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </div>
                {review.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {review.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImg(idx)}
                        className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          idx === activeImg
                            ? "border-[#b51c00] scale-105"
                            : "border-gray-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`thumb ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Reply */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Phản hồi của Admin
              </p>
              {canEdit && hasReply && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                      Xóa phản hồi
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg font-bold">
                        Xóa phản hồi?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-sm text-gray-600">
                        Phản hồi sẽ bị xóa vĩnh viễn khỏi đánh giá này. Hành
                        động này không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer">
                        Hủy
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteReply(review._id)}
                        className="bg-red-600 hover:bg-red-700 cursor-pointer"
                      >
                        Xóa phản hồi
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {hasReply ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {review.adminReply?.repliedBy?.userId?.avatarUrl ? (
                    <img
                      src={review.adminReply.repliedBy.userId.avatarUrl}
                      alt={
                        review.adminReply.repliedBy.userId.displayName ||
                        "Admin"
                      }
                      className="w-6 h-6 rounded-full object-cover border border-emerald-300"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
                      A
                    </div>
                  )}
                  <p className="text-xs font-semibold text-emerald-900">
                    {review.adminReply?.repliedBy?.userId?.displayName ??
                      "Admin"}
                  </p>

                  <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-full font-semibold">
                    {review.adminReply?.repliedBy?.roleId?.title}
                  </span>

                  {review.adminReply?.repliedAt && (
                    <p className="text-[10px] text-emerald-600">
                      ·{" "}
                      {new Date(review.adminReply.repliedAt).toLocaleDateString(
                        "vi-VN",
                      )}
                    </p>
                  )}
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed">
                  {review.adminReply?.content}
                </p>
              </div>
            ) : canEdit ? (
              replyMode ? (
                <div className="space-y-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Nhập nội dung phản hồi..."
                    rows={4}
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent resize-none disabled:opacity-60"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSubmitReply}
                      disabled={submitting}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#b51c00] text-white hover:bg-[#8a1500] transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <Send size={14} />
                      {submitting ? "Đang gửi..." : "Gửi phản hồi"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyMode(false);
                        setReplyContent("");
                      }}
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setReplyMode(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#b51c00] hover:text-[#b51c00] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Reply size={16} />
                  Nhấn để phản hồi đánh giá này
                </button>
              )
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">Chưa có phản hồi</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDetailDialog;

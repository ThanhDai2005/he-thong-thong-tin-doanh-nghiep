import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Star,
  Eye,
  Image as ImageIcon,
  TrendingUp,
  MessageSquare,
  Award,
  Filter,
  EyeOff,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";
import AdminPagination from "@/components/admin/AdminPagination";
import ReviewDetailDialog from "@/components/admin/ReviewDetailDialog";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { useAdminReviewStore } from "@/stores/useAdminReviewStore";
import { hasPermission } from "@/lib/permissions";
import type { Review } from "@/types/review";

// ── Star display helper ──────────────────────────────────────────────────────
const StarRating = ({
  rating,
  size = 14,
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

// ── Rating badge colour ──────────────────────────────────────────────────────
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

// ── Main Component ────────────────────────────────────────────────────────────
const ReviewManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("keyword") || "";
  const ratingFilter = searchParams.get("rating") || "all";
  const visibilityFilter = searchParams.get("visibility") || "all";
  const sortKey = searchParams.get("sortKey") || "createdAt";
  const sortValue = searchParams.get("sortValue") || "-1";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const [localKeyword, setLocalKeyword] = useState(searchTerm);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const { user } = useAdminAuthStore();
  const {
    reviews,
    totalPages,
    totalItems,
    loading,
    stats,
    fetchReviews,
    fetchStats,
    replyReview,
    deleteReply,
    toggleHidden,
  } = useAdminReviewStore();

  const canView = hasPermission(user, "reviews_view");
  const canEdit = hasPermission(user, "reviews_edit");

  const showSkeleton = loading && reviews.length === 0;
  const showOverlay = loading && reviews.length > 0;

  // ── URL helpers ────────────────────────────────────────────────────────────
  const updateURL = (newParams: Record<string, string>) => {
    const params = Object.fromEntries(searchParams.entries());
    const merged = { ...params, ...newParams };

    Object.keys(merged).forEach((key) => {
      if (
        !merged[key] ||
        (key === "page" && merged[key] === "1") ||
        (key === "rating" && merged[key] === "all") ||
        (key === "visibility" && merged[key] === "all") ||
        (key === "sortKey" && merged[key] === "createdAt") ||
        (key === "sortValue" && merged[key] === "-1") ||
        (key === "limit" && merged[key] === "10") ||
        (key === "keyword" && merged[key] === "")
      ) {
        delete merged[key];
      }
    });
    setSearchParams(merged);
  };

  // ── Debounce keyword ───────────────────────────────────────────────────────
  useEffect(() => {
    setLocalKeyword(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localKeyword !== searchTerm) {
        updateURL({ keyword: localKeyword, page: "1" });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localKeyword]);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (canView) {
      fetchReviews(
        searchTerm,
        ratingFilter,
        visibilityFilter,
        currentPage,
        limit,
        sortKey,
        sortValue,
      );
    }
  }, [
    searchTerm,
    ratingFilter,
    visibilityFilter,
    currentPage,
    limit,
    sortKey,
    sortValue,
    canView,
  ]);

  useEffect(() => {
    if (canView) {
      fetchStats();
    }
  }, [canView]);

  useEffect(() => {
    if (!selectedReview) return;
    const latest = reviews.find((r) => r._id === selectedReview._id);
    if (latest) {
      setSelectedReview(latest);
    }
  }, [reviews]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleReply = async (reviewId: string, content: string) => {
    try {
      const updated = await replyReview(reviewId, content);
      if (updated && selectedReview?._id === reviewId) {
        setSelectedReview((prev) => (prev ? { ...prev, ...updated } : prev));
      }
      fetchStats(); // cập nhật số "đã phản hồi" nếu stats có
    } catch {
      // toast đã xử lý trong store
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    try {
      const updated = await deleteReply(reviewId);
      if (selectedReview?._id === reviewId) {
        setSelectedReview((prev) =>
          prev
            ? {
                ...prev,
                ...(updated || {}),
                adminReply: {
                  content: "",
                  repliedAt: null,
                  repliedBy: null,
                },
              }
            : prev,
        );
      }
      fetchStats();
    } catch {
      // handled in store
    }
  };

  const handleToggleHidden = async (reviewId: string) => {
    try {
      const result = await toggleHidden(reviewId);
      if (result && selectedReview?._id === reviewId) {
        setSelectedReview((prev) =>
          prev ? { ...prev, isHidden: result.isHidden } : prev,
        );
      }
      fetchStats();
    } catch {
      // handled in store
    }
  };

  // ── Sort toggle ────────────────────────────────────────────────────────────
  const handleSortToggle = (field: string) => {
    if (sortKey === field) {
      updateURL({
        sortKey: field,
        sortValue: sortValue === "-1" ? "1" : "-1",
        page: "1",
      });
    } else {
      updateURL({ sortKey: field, sortValue: "-1", page: "1" });
    }
  };

  const getSortIcon = (field: string) => {
    if (sortKey !== field) return "↕";
    return sortValue === "-1" ? "↓" : "↑";
  };

  // ── Permission guard ───────────────────────────────────────────────────────
  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý đánh giá", isCurrentPage: true },
        ]}
      />
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      {/* BREADCRUMB HEADER */}
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý đánh giá", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* PAGE TITLE */}
        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
          Quản lý đánh giá sản phẩm
        </h1>

        {/* STATS CARDS */}
        {loading && !stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-[12px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 flex items-center gap-4 animate-pulse"
              >
                <div className="w-11 h-11 rounded-xl bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-20" />
                  <div className="h-7 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total */}
            <div className="bg-white rounded-[12px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <MessageSquare size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Tổng đánh giá
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total.toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            {/* Average rating */}
            <div className="bg-white rounded-[12px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Star size={20} className="text-amber-500 fill-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Điểm trung bình
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.avgRating}
                  <span className="text-sm text-gray-400 font-normal ml-1">
                    / 5
                  </span>
                </p>
              </div>
            </div>

            {/* 5-star count */}
            <div className="bg-white rounded-[12px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Award size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Đánh giá 5 sao
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.ratingDistribution.find((r) => r._id === 5)?.count ??
                    0}
                </p>
              </div>
            </div>

            {/* Low rating count */}
            <div className="bg-white rounded-[12px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <TrendingUp size={20} className="text-red-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Đánh giá ≤ 2 sao
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.ratingDistribution.find((r) => r._id === 1)?.count ??
                    0) +
                    (stats.ratingDistribution.find((r) => r._id === 2)?.count ??
                      0)}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* RATING DISTRIBUTION BAR */}
        {stats && stats.total > 0 && (
          <div className="bg-white rounded-[12px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={16} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">
                Phân bố điểm đánh giá
              </h2>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count =
                  stats.ratingDistribution.find((r) => r._id === star)?.count ??
                  0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                const barColor =
                  star >= 5
                    ? "bg-emerald-400"
                    : star >= 4
                      ? "bg-green-400"
                      : star >= 3
                        ? "bg-yellow-400"
                        : star >= 2
                          ? "bg-orange-400"
                          : "bg-red-400";
                return (
                  <button
                    key={star}
                    onClick={() =>
                      updateURL({
                        rating:
                          ratingFilter === String(star) ? "all" : String(star),
                        page: "1",
                      })
                    }
                    className={`w-full flex items-center gap-3 group cursor-pointer rounded-lg px-2 py-1 transition-colors ${
                      ratingFilter === String(star)
                        ? "bg-amber-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-1 w-14 shrink-0">
                      <span className="text-sm font-medium text-gray-700">
                        {star}
                      </span>
                      <Star
                        size={12}
                        className="fill-amber-400 text-amber-400"
                      />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right shrink-0">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FILTERS ROW */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Left: Search + Rating filter + Visibility filter */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Tìm kiếm theo nội dung..."
                value={localKeyword}
                onChange={(e) => setLocalKeyword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white transition-shadow"
              />
            </div>

            {/* Rating filter */}
            <select
              value={ratingFilter}
              onChange={(e) => updateURL({ rating: e.target.value, page: "1" })}
              className="w-full sm:w-44 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white cursor-pointer"
            >
              <option value="all">Tất cả sao</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={String(r)}>
                  {r} sao
                </option>
              ))}
            </select>

            {/* Visibility filter */}
            <select
              value={visibilityFilter}
              onChange={(e) =>
                updateURL({ visibility: e.target.value, page: "1" })
              }
              className="w-full sm:w-44 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="visible">Đang hiển thị</option>
              <option value="hidden">Đang ẩn</option>
            </select>
          </div>

          {/* Right: total count */}
          {!loading && (
            <p className="text-sm text-gray-500 shrink-0">
              <span className="font-semibold text-gray-800">
                {totalItems.toLocaleString("vi-VN")}
              </span>{" "}
              đánh giá
            </p>
          )}
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden relative">
          {/* Loading overlay */}
          {showOverlay && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#b51c00] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[16px] font-bold text-gray-900">
              Danh sách đánh giá
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[12px] text-gray-500 bg-[#f1f5f9] uppercase font-bold border-b border-gray-200 tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-10">STT</th>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4 text-center">Nội dung</th>
                  <th
                    className="px-6 py-4 text-center cursor-pointer select-none hover:text-gray-700 transition-colors"
                    onClick={() => handleSortToggle("rating")}
                  >
                    Sao {getSortIcon("rating")}
                  </th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th
                    className="px-6 py-4 text-center cursor-pointer select-none hover:text-gray-700 transition-colors"
                    onClick={() => handleSortToggle("createdAt")}
                  >
                    Ngày {getSortIcon("createdAt")}
                  </th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {showSkeleton ? (
                  // Skeleton rows
                  Array.from({ length: limit }).map((_, i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-gray-50"
                    >
                      {/* STT */}
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-6" />
                      </td>
                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
                          <div className="h-4 bg-gray-200 rounded w-36" />
                        </div>
                      </td>
                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
                          <div className="space-y-1">
                            <div className="h-3.5 bg-gray-200 rounded w-28" />
                            <div className="h-3 bg-gray-200 rounded w-20" />
                          </div>
                        </div>
                      </td>
                      {/* Content */}
                      <td className="px-6 py-4">
                        <div className="space-y-1 max-w-xs">
                          <div className="h-3.5 bg-gray-200 rounded w-full" />
                          <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                        </div>
                      </td>
                      {/* Rating */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-3.5 bg-gray-200 rounded w-16" />
                          <div className="h-5 bg-gray-200 rounded-full w-12" />
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <div className="h-5 bg-gray-200 rounded-full w-20" />
                        </div>
                      </td>
                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="space-y-1 flex flex-col items-center">
                          <div className="h-3.5 bg-gray-200 rounded w-20" />
                          <div className="h-3 bg-gray-200 rounded w-14" />
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <div className="h-7 bg-gray-200 rounded-lg w-16" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : reviews.length > 0 ? (
                  reviews.map((review, index) => (
                    <tr
                      key={review._id}
                      className="border-b border-gray-50 hover:bg-[#f8fafc] transition-colors group"
                    >
                      {/* STT */}
                      <td className="px-6 py-4 font-medium text-gray-500 text-[13px]">
                        {(currentPage - 1) * limit + index + 1}
                      </td>

                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {review.productId?.images?.[0] ? (
                            <img
                              src={review.productId.images[0]}
                              alt={review.productId.name}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                              <ImageIcon size={14} className="text-gray-300" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900 max-w-[180px] truncate text-[13px]">
                            {review.productId?.name ?? "—"}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {review.customerId?.userId?.avatarUrl ? (
                            <img
                              src={review.customerId.userId.avatarUrl}
                              alt={review.customerId.userId.displayName}
                              className="w-8 h-8 rounded-full object-cover border border-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b51c00] to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {review.customerId?.userId?.displayName?.[0]?.toUpperCase() ??
                                "K"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-[13px] truncate max-w-[140px]">
                              {review.customerId?.userId?.displayName ??
                                "Ẩn danh"}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[140px]">
                              {review.customerId?.userId?.phone ?? ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Comment */}
                      <td className="px-6 py-4 max-w-xs">
                        {review.comment ? (
                          <p className="text-gray-700 text-[13px] line-clamp-2 leading-snug">
                            {review.comment}
                          </p>
                        ) : (
                          <span className="text-gray-300 text-[12px] italic">
                            Không có nhận xét
                          </span>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <StarRating rating={review.rating} size={13} />
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ratingBadgeClass(review.rating)}`}
                          >
                            {review.rating}/5
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {review.isHidden ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                            <EyeOff size={11} />
                            Đang ẩn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <Eye size={11} />
                            Hiển thị
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-center">
                        <p className="text-[13px] text-gray-700">
                          {new Date(review.createdAt).toLocaleDateString(
                            "vi-VN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            },
                          )}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(review.createdAt).toLocaleTimeString(
                            "vi-VN",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedReview(review)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer mx-auto"
                        >
                          <Eye size={13} />
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  // Empty state
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Star
                            size={28}
                            className="text-gray-300 fill-gray-200"
                          />
                        </div>
                        <p className="text-gray-500 font-medium">
                          Chưa có đánh giá nào
                        </p>
                        <p className="text-sm text-gray-400">
                          {searchTerm ||
                          ratingFilter !== "all" ||
                          visibilityFilter !== "all"
                            ? "Thử thay đổi bộ lọc để xem kết quả khác"
                            : "Đánh giá từ khách hàng sẽ xuất hiện tại đây"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              limit={limit}
              onPageChange={(page) => updateURL({ page: String(page) })}
              onLimitChange={(newLimit) =>
                updateURL({ limit: String(newLimit), page: "1" })
              }
            />
          )}
        </div>
      </div>

      {/* DETAIL DIALOG */}
      <ReviewDetailDialog
        review={selectedReview}
        open={!!selectedReview}
        onOpenChange={(open) => !open && setSelectedReview(null)}
        canEdit={canEdit}
        onReply={handleReply}
        onDeleteReply={handleDeleteReply}
        onToggleHidden={handleToggleHidden}
      />
    </div>
  );
};

export default ReviewManagement;

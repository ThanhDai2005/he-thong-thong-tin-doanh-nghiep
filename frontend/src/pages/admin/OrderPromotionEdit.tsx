import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminOrderPromotionStore } from "@/stores/useAdminOrderPromotionStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { Tag, Calendar, Users, Info, Loader2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminFormActions from "@/components/admin/AdminFormActions";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const OrderPromotionEdit = () => {
  const navigate = useNavigate();
  const { orderPromotionId } = useParams<{ orderPromotionId: string }>();
  const { user } = useAdminAuthStore();
  const { loading, currentOrderPromotion, getDetail, update } =
    useAdminOrderPromotionStore();

  const [formData, setFormData] = useState({
    title: "",
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    maxDiscountAmount: "",
    usageLimit: "",
    minOrderValue: "",
    startDate: "",
    endDate: "",
    status: "active",
  });

  const canEdit = hasPermission(user, "order_promotions_edit");

  useEffect(() => {
    if (orderPromotionId) {
      getDetail(orderPromotionId);
    }
  }, [orderPromotionId, getDetail]);

  useEffect(() => {
    if (currentOrderPromotion && currentOrderPromotion.promotionId) {
      const promotion = currentOrderPromotion.promotionId;
      setFormData({
        title: promotion.title || "",
        code: promotion.code || "",
        discountType: promotion.discountType || "percentage",
        discountValue: promotion.discountValue?.toString() || "",
        maxDiscountAmount: promotion.maxDiscountAmount?.toString() || "",
        usageLimit: promotion.usageLimit?.toString() || "",
        minOrderValue: currentOrderPromotion.minOrderValue?.toString() || "",
        startDate: promotion.startDate
          ? new Date(promotion.startDate).toISOString().slice(0, 16)
          : "",
        endDate: promotion.endDate
          ? new Date(promotion.endDate).toISOString().slice(0, 16)
          : "",
        status: promotion.status || "active",
      });
    }
  }, [currentOrderPromotion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.code.trim() ||
      !formData.discountValue ||
      !formData.minOrderValue ||
      !formData.startDate ||
      !formData.endDate ||
      !orderPromotionId
    ) {
      return;
    }

    try {
      await update(orderPromotionId, {
        title: formData.title.trim(),
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount
          ? Number(formData.maxDiscountAmount)
          : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        minOrderValue: Number(formData.minOrderValue),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
      });
      navigate("/admin/order-promotions");
    } catch (error) {
      // Error already handled in store
    }
  };

  if (!canEdit) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          {
            label: "Quản lý khuyến mãi đơn hàng",
            href: "/admin/order-promotions",
          },
          { label: "Sửa khuyến mãi", isCurrentPage: true },
        ]}
      />
    );
  }

  if (loading && !currentOrderPromotion) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen pb-12">
        <AdminHeader
          items={[
            { label: "Admin", href: "/admin/dashboard" },
            {
              label: "Quản lý khuyến mãi đơn hàng",
              href: "/admin/order-promotions",
            },
            { label: "Sửa khuyến mãi", isCurrentPage: true },
          ]}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#b51c00]" />
            <span className="text-sm font-semibold text-gray-600">
              Đang tải dữ liệu...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          {
            label: "Quản lý khuyến mãi đơn hàng",
            href: "/admin/order-promotions",
          },
          { label: "Sửa khuyến mãi", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
        <AdminPageHeading
          title="Sửa khuyến mãi đơn hàng"
          subtitle="Cập nhật thông tin chương trình giảm giá cho đơn hàng"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* THÔNG TIN CỐT LÕI */}
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#b51c00]/5 to-transparent">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#b51c00]" />
                <h2 className="text-[16px] font-bold text-gray-900">
                  Thông tin cơ bản
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Tên khuyến mãi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên khuyến mãi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="VD: Giảm giá đơn hàng từ 500K"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                  required
                />
              </div>

              {/* Mã khuyến mãi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mã khuyến mãi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="VD: ORDER500K"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all font-mono uppercase"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Tag className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Mã sẽ tự động viết hoa, không có khoảng trắng
                </p>
              </div>

              {/* Loại & Giá trị giảm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white cursor-pointer transition-all"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VND)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giá trị giảm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountValue: e.target.value,
                        })
                      }
                      placeholder={
                        formData.discountType === "percentage"
                          ? "VD: 10"
                          : "VD: 50000"
                      }
                      min="0"
                      max={
                        formData.discountType === "percentage"
                          ? "100"
                          : undefined
                      }
                      className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 font-semibold">
                      {formData.discountType === "percentage" ? (
                        <>
                          <span className="text-xs">%</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs">VND</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Giảm tối đa (cho %) */}
              {formData.discountType === "percentage" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giảm giá tối đa (VND)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxDiscountAmount: e.target.value,
                        })
                      }
                      placeholder="VD: 100000 (bỏ trống = không giới hạn)"
                      min="0"
                      className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-500 font-semibold">
                      <span className="text-xs">VND</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Số tiền giảm tối đa khi áp dụng phần trăm
                  </p>
                </div>
              )}

              {/* Giá trị đơn tối thiểu */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giá trị đơn hàng tối thiểu (VND){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOrderValue: e.target.value,
                      })
                    }
                    placeholder="VD: 500000"
                    min="0"
                    className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-500 font-semibold">
                    <span className="text-xs">VND</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Đơn hàng phải đạt giá trị này mới áp dụng được khuyến mãi
                </p>
              </div>

              {/* Thông tin sử dụng */}
              {currentOrderPromotion?.promotionId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-blue-900">
                        Thống kê sử dụng
                      </p>
                      <p className="text-sm text-blue-700">
                        Đã sử dụng:{" "}
                        <strong>
                          {currentOrderPromotion.promotionId.usedCount || 0}
                        </strong>{" "}
                        lần
                        {currentOrderPromotion.promotionId.usageLimit &&
                          ` / ${currentOrderPromotion.promotionId.usageLimit} lần`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* THỜI GIAN & GIỚI HẠN */}
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-500/5 to-transparent">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-[16px] font-bold text-gray-900">
                  Thời gian & Giới hạn
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Thời gian */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* Giới hạn số lần dùng */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giới hạn số lần sử dụng
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, usageLimit: e.target.value })
                    }
                    placeholder="VD: 100 (bỏ trống = không giới hạn)"
                    min="0"
                    className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Tổng số lần mã này có thể được sử dụng bởi tất cả khách hàng
                </p>
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00]/20 focus:border-[#b51c00] bg-white cursor-pointer transition-all"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngưng hoạt động</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <AdminFormActions
            loading={loading}
            submitLabel="Cập nhật khuyến mãi"
          />
        </form>
      </div>
    </div>
  );
};

export default OrderPromotionEdit;

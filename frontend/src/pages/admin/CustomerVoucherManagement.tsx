import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Search,
  Plus,
  Loader2,
  Gift,
  Users,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminCustomerVoucherStore } from "@/stores/useAdminCustomerVoucherStore";
import { hasPermission } from "@/lib/permissions";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const CustomerVoucherManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("keyword") || "";
  const statusFilter = searchParams.get("status") || "all";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const [localKeyword, setLocalKeyword] = useState(searchTerm);

  const { user } = useAdminAuthStore();
  const { customerVouchers, totalPages, loading, fetchCustomerVouchers } =
    useAdminCustomerVoucherStore();

  const showSkeleton = loading && customerVouchers.length === 0;
  const showOverlay = loading && customerVouchers.length > 0;

  const canView = hasPermission(user, "customer_vouchers_view");
  const canCreate = hasPermission(user, "customer_vouchers_create");

  const updateURL = (newParams: Record<string, string>) => {
    const params = Object.fromEntries(searchParams.entries());
    const mergedParams = { ...params, ...newParams };

    Object.keys(mergedParams).forEach((key) => {
      if (
        !mergedParams[key] ||
        (key === "page" && mergedParams[key] === "1") ||
        (key === "status" && mergedParams[key] === "all") ||
        (key === "limit" && mergedParams[key] === "10") ||
        (key === "keyword" && mergedParams[key] === "")
      ) {
        delete mergedParams[key];
      }
    });
    setSearchParams(mergedParams);
  };

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

  const refetchVouchers = async () => {
    const status = statusFilter !== "all" ? statusFilter : "";
    await fetchCustomerVouchers(searchTerm, status, currentPage, limit);
  };

  useEffect(() => {
    if (canView) {
      refetchVouchers();
    }
  }, [currentPage, limit, searchTerm, statusFilter, fetchCustomerVouchers, canView]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("vi-VN"),
      time: d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const formatDiscount = (promotion: {
    discountType: string;
    discountValue: number;
  }) => {
    if (promotion.discountType === "percentage") {
      return `${promotion.discountValue}%`;
    }
    return formatCurrency(promotion.discountValue);
  };

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý voucher khách hàng", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý voucher khách hàng", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* TITLE & FILTERS */}
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 mb-6 tracking-tight">
            Quản lý voucher khách hàng
          </h1>

          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            {/* Left: Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm mã, tiêu đề..."
                  value={localKeyword}
                  onChange={(e) => setLocalKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white transition-shadow"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  updateURL({ status: e.target.value, page: "1" })
                }
                className="w-full sm:w-48 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngưng hoạt động</option>
              </select>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              {canCreate && (
                <button
                  onClick={() => navigate("/admin/customer-vouchers/create")}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#b51c00] text-white rounded-[20px] font-semibold text-sm hover:bg-[#8e1400] shadow-sm shadow-red-500/20 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Tạo voucher mới
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[18px] font-bold text-gray-900">Danh sách</h2>
          </div>

          <div className="relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[12px] text-gray-500 bg-[#f1f5f9] uppercase font-bold border-b border-gray-200 tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-4 text-center">
                      STT
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Tên / Mã
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-center leading-tight"
                    >
                      Giảm
                      <br />
                      giá
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-center leading-tight"
                    >
                      Đã phát
                      <br />
                      hành
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-center leading-tight"
                    >
                      Đã sử
                      <br />
                      dụng
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-center leading-tight"
                    >
                      Số lần
                      <br />
                      dùng
                    </th>
                    <th scope="col" className="px-4 py-4 text-center">
                      Trạng thái
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-center leading-tight"
                    >
                      Ngày bắt
                      <br />
                      đầu
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 text-center leading-tight"
                    >
                      Ngày kết
                      <br />
                      thúc
                    </th>
                    <th scope="col" className="px-4 py-4 text-center">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {showSkeleton ? (
                    Array.from({ length: limit }).map((_, index) => (
                      <tr
                        key={index}
                        className="animate-pulse bg-white border-b border-gray-50"
                      >
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-8 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
                        </td>
                        <td className="px-4 py-5 text-center">
                          <div className="h-6 bg-gray-200 rounded-md w-20 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex gap-2 justify-center">
                            <div className="h-7 bg-gray-200 rounded w-24" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : customerVouchers.length > 0 ? (
                    customerVouchers.map((item, index) => {
                      const promotion = item.promotionId;
                      if (!promotion) return null;

                      const start = formatDateTime(promotion.startDate);
                      const end = formatDateTime(promotion.endDate);
                      const isPercentage =
                        promotion.discountType === "percentage";
                      const isActive = promotion.status === "active";
                      const now = new Date();
                      const isExpired = now > new Date(promotion.endDate);
                      const isUpcoming = now < new Date(promotion.startDate);

                      return (
                        <tr
                          key={item._id}
                          className="bg-white border-b border-gray-50 hover:bg-[#f8fafc] transition-colors group"
                        >
                          <td className="px-4 py-5 font-bold text-gray-900 text-center">
                            {(currentPage - 1) * limit + index + 1}
                          </td>

                          <td className="px-4 py-5">
                            <div className="font-semibold text-gray-900">
                              {promotion.title}
                            </div>
                            <code className="text-[12px] font-bold text-[#92400e] bg-[#fef3c7] px-1.5 py-0.5 rounded border border-[#fde68a]">
                              {promotion.code}
                            </code>
                            {isExpired && (
                              <div className="text-[11px] text-red-600 font-medium mt-0.5">
                                Đã hết hạn
                              </div>
                            )}
                            {isUpcoming && !isExpired && (
                              <div className="text-[11px] text-blue-600 font-medium mt-0.5">
                                Sắp diễn ra
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-5 text-center">
                            <span
                              className={`inline-flex items-center justify-center px-2 py-1 rounded-[4px] text-[12px] font-bold text-white min-w-[36px] ${
                                isPercentage ? "bg-[#22c55e]" : "bg-[#3b82f6]"
                              }`}
                            >
                              {formatDiscount(promotion)}
                            </span>
                            {isPercentage && promotion.maxDiscountAmount ? (
                              <div className="text-[11px] text-gray-400 mt-1">
                                Tối đa{" "}
                                {formatCurrency(promotion.maxDiscountAmount)}
                              </div>
                            ) : null}
                          </td>

                          <td className="px-4 py-5 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-bold text-[#8b5cf6]">
                              <Gift className="w-4 h-4" />
                              {item.totalIssued}
                            </div>
                          </td>

                          <td className="px-4 py-5 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-bold text-[#10b981]">
                              <CheckCircle2 className="w-4 h-4" />
                              {item.totalUsed}
                            </div>
                          </td>

                          <td className="px-4 py-5 font-bold text-gray-700 text-center">
                            {promotion.usedCount ?? 0}
                            {promotion.usageLimit != null && (
                              <span className="text-gray-400 font-medium">
                                {" "}
                                / {promotion.usageLimit}
                              </span>
                            )}
                            {promotion.usageLimit == null && (
                              <span className="text-gray-400 font-medium">
                                {" "}
                                / ∞
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-5 text-center">
                            {isActive ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#d1fae5] text-[#15803d]">
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#fee2e2] text-[#b91c1c]">
                                Ngưng hoạt động
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-5 text-gray-500 font-medium text-center ">
                            {start.date}
                            <br />
                            {start.time}
                          </td>

                          <td className="px-4 py-5 text-gray-500 font-medium text-center ">
                            {end.date}
                            <br />
                            {end.time}
                          </td>

                          <td className="px-4 py-5">
                            <div className="flex items-center justify-center gap-2">
                              {canCreate && (
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/admin/customer-vouchers/issue/${item._id}`,
                                    )
                                  }
                                  className="px-3 py-1.5 border border-[#8b5cf6] text-[#7c3aed] rounded-[6px] text-xs font-bold hover:bg-[#f5f3ff] transition-colors flex items-center gap-1"
                                >
                                  <Users className="w-3 h-3" />
                                  Phát voucher
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        Không tìm thấy voucher khách hàng nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {showOverlay && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-[#b51c00]" />
                  <span className="text-sm font-semibold text-gray-600">
                    Đang tải...
                  </span>
                </div>
              </div>
            )}
          </div>

          {customerVouchers.length > 0 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              limit={limit}
              onPageChange={(page) => updateURL({ page: page.toString() })}
              onLimitChange={(newLimit) =>
                updateURL({ limit: newLimit.toString(), page: "1" })
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerVoucherManagement;

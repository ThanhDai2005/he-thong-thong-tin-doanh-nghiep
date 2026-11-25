import { useState, useEffect } from "react";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { useAdminStatisticStore } from "@/stores/useAdminStatisticStore";
import AdminHeader from "@/components/admin/AdminHeader";
import { adminExportService } from "@/services/adminExportService";
import { toast } from "sonner";

import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const StatisticPage = () => {
  const [periodMode, setPeriodMode] = useState<"month" | "quarter" | "year">(
    "quarter",
  );
  const [customerMode, setCustomerMode] = useState<"year" | "quarter">("year");
  const [customerYear, setCustomerYear] = useState(new Date().getFullYear());
  const [productMode, setProductMode] = useState<"month" | "quarter" | "year">(
    "quarter",
  );
  const [productYear, setProductYear] = useState(new Date().getFullYear());
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productsExporting, setProductsExporting] = useState(false);

  const {
    stats,
    loading,
    fetchStats,
    productStats,
    productsLoading,
    fetchProductStats,
  } = useAdminStatisticStore();

  const currentProductStats =
    productStats?.mode === productMode && productStats.year === productYear
      ? productStats
      : null;
  const selectedProduct = currentProductStats?.products.find(
    (item) => item.productId === selectedProductId,
  );
  const chartProducts = selectedProduct
    ? [selectedProduct]
    : currentProductStats?.products || [];
  const productChartTitle =
    selectedProduct?.productName || "Tất cả sản phẩm trong Top 5";
  const productChartQuantity = chartProducts.reduce(
    (sum, item) => sum + item.totalQuantity,
    0,
  );
  const productChartRevenue = chartProducts.reduce(
    (sum, item) => sum + item.totalRevenue,
    0,
  );
  const productChartData =
    currentProductStats?.periods.map((period) => ({
      period,
      quantity: chartProducts.reduce(
        (sum, item) => sum + (item.periods[period]?.quantity || 0),
        0,
      ),
    })) || [];
  const productModeLabel =
    productMode === "month"
      ? "tháng"
      : productMode === "quarter"
        ? "quý"
        : "năm";
  const productRangeLabel =
    productMode === "year"
      ? `${productYear - 2} – ${productYear}`
      : `năm ${productYear}`;

  useEffect(() => {
    fetchProductStats(productMode, productYear);
  }, [fetchProductStats, productMode, productYear]);

  useEffect(() => {
    if (customerMode === "quarter") {
      fetchStats(undefined, undefined, undefined, customerYear).catch(() =>
        toast.error("Không thể tải thống kê"),
      );
    } else {
      fetchStats().catch(() => toast.error("Không thể tải thống kê"));
    }
  }, [fetchStats, customerMode, customerYear]);

  // Export handlers
  const handleExportRevenueByPeriod = async () => {
    const dataMap = {
      month: stats?.revenueByMonth,
      quarter: stats?.revenueByQuarter,
      year: stats?.revenueByYear,
    };

    const currentData = dataMap[periodMode];

    if (!currentData || currentData.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    try {
      await adminExportService.exportDashboardRevenueByPeriod(
        currentData,
        periodMode,
        new Date().getFullYear(),
      );
      toast.success("Xuất Excel thành công");
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);
      toast.error("Lỗi khi xuất file Excel");
    }
  };

  const handleExportRevenueByStaff = async () => {
    if (!stats?.revenueByStaff || stats.revenueByStaff.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    try {
      await adminExportService.exportDashboardRevenueByStaff(
        stats.revenueByStaff,
      );
      toast.success("Xuất Excel doanh thu theo nhân viên thành công");
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);
      toast.error("Lỗi khi xuất file Excel");
    }
  };

  const handleExportProductStatistics = async () => {
    if (!currentProductStats || currentProductStats.products.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    try {
      setProductsExporting(true);
      await adminExportService.exportProductStatistics(currentProductStats);
      toast.success("Xuất Excel thành công");
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);
      toast.error("Lỗi khi xuất file Excel");
    } finally {
      setProductsExporting(false);
    }
  };

  const handleExportRevenueByCustomer = async () => {
    const dataMap = {
      year: stats?.revenueByCustomerYear,
      quarter: stats?.revenueByCustomerQuarter,
    };

    const currentData = dataMap[customerMode];

    if (!currentData || currentData.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    try {
      await adminExportService.exportDashboardRevenueByCustomer(
        currentData,
        customerMode,
        customerYear,
      );
      toast.success("Xuất Excel thành công");
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);
      toast.error("Lỗi khi xuất file Excel");
    }
  };

  return (
    <div className="min-w-0 w-full bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Thống kê", isCurrentPage: true },
        ]}
      />

      <div className="flex flex-col gap-8 p-6 md:p-8 max-w-[1600px] mx-auto">
        {/* TITLE */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">
            Thống Kê Hệ Thống
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Phân tích doanh thu, chi phí, lợi nhuận theo thời gian và đối tượng
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="w-10 h-10 animate-spin text-[#b51c00]" />
          </div>
        ) : (
          <>
            {/* 1. SECTION: BẢNG THU-CHI-LỢI NHUẬN + BIỂU ĐỒ */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Cột trái: Bảng */}
              <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 p-6 lg:col-span-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-[18px] font-bold text-gray-900">
                      Thống Kê Thu - Chi - Lợi Nhuận
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {periodMode === "month"
                        ? `12 tháng năm ${new Date().getFullYear()}`
                        : periodMode === "quarter"
                          ? `4 quý năm ${new Date().getFullYear()}`
                          : "Các năm 2024 - 2026"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Tabs chọn chế độ */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setPeriodMode("month")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                          periodMode === "month"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Tháng
                      </button>
                      <button
                        onClick={() => setPeriodMode("quarter")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                          periodMode === "quarter"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Quý
                      </button>
                      <button
                        onClick={() => setPeriodMode("year")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                          periodMode === "year"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Năm
                      </button>
                    </div>

                    {/* Nút xuất Excel */}
                    <button
                      onClick={handleExportRevenueByPeriod}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        (periodMode === "month" &&
                          (!stats?.revenueByMonth ||
                            stats.revenueByMonth.length === 0)) ||
                        (periodMode === "quarter" &&
                          (!stats?.revenueByQuarter ||
                            stats.revenueByQuarter.length === 0)) ||
                        (periodMode === "year" &&
                          (!stats?.revenueByYear ||
                            stats.revenueByYear.length === 0))
                      }
                    >
                      <FileSpreadsheet size={16} />
                      Xuất Excel
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table
                    className={`w-full ${periodMode == "month" ? "text-xs" : "text-sm"} `}
                  >
                    <thead className="text-[11px] text-gray-500 bg-[#f8fafc] uppercase font-bold border-b border-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-left sticky left-0 bg-[#f8fafc] z-10">
                          Chỉ Tiêu
                        </th>
                        {periodMode === "month" &&
                          stats?.revenueByMonth?.map((item, idx) => (
                            <th key={idx} className="px-2 py-2 text-right ">
                              {item.month}
                            </th>
                          ))}
                        {periodMode === "quarter" &&
                          stats?.revenueByQuarter?.map((item, idx) => (
                            <th key={idx} className="px-2 py-2 text-right ">
                              {item.quarter}
                            </th>
                          ))}
                        {periodMode === "year" &&
                          stats?.revenueByYear?.map((item, idx) => (
                            <th key={idx} className="px-2 py-2 text-right ">
                              {item.year}
                            </th>
                          ))}
                        <th className="px-2 py-2 text-right ">Tổng Cộng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Dòng 1: Tổng Thu */}
                      <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-2 py-2 font-bold text-gray-900 sticky left-0 bg-white z-10 text-[11px]">
                          Tổng Thu (HD)
                        </td>
                        {periodMode === "month" &&
                          stats?.revenueByMonth?.map((item, idx) => (
                            <td
                              key={idx}
                              className="px-2 py-2 text-right font-semibold text-gray-700"
                            >
                              {item.revenue.toLocaleString("vi-VN")}đ
                            </td>
                          ))}
                        {periodMode === "quarter" &&
                          stats?.revenueByQuarter?.map((item, idx) => (
                            <td
                              key={idx}
                              className="px-2 py-2 text-right font-semibold text-gray-700 "
                            >
                              {item.revenue.toLocaleString("vi-VN")}đ
                            </td>
                          ))}
                        {periodMode === "year" &&
                          stats?.revenueByYear?.map((item, idx) => (
                            <td
                              key={idx}
                              className="px-2 py-2 text-right font-semibold text-gray-700"
                            >
                              {item.revenue.toLocaleString("vi-VN")}đ
                            </td>
                          ))}
                        <td className="px-2 py-2 text-right font-extrabold text-gray-900 text-base">
                          {(periodMode === "month"
                            ? stats?.revenueByMonth?.reduce(
                                (sum, item) => sum + item.revenue,
                                0,
                              )
                            : periodMode === "quarter"
                              ? stats?.revenueByQuarter?.reduce(
                                  (sum, item) => sum + item.revenue,
                                  0,
                                )
                              : stats?.revenueByYear?.reduce(
                                  (sum, item) => sum + item.revenue,
                                  0,
                                )
                          )?.toLocaleString("vi-VN")}
                          đ
                        </td>
                      </tr>

                      {/* Dòng 2: Tổng Chi */}
                      <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-2 py-2 font-bold text-gray-900 sticky left-0 bg-white z-10 text-[11px]">
                          Tổng Chi (PNH)
                        </td>
                        {periodMode === "month" &&
                          stats?.revenueByMonth?.map((item, idx) => (
                            <td
                              key={idx}
                              className="px-2 py-2 text-right font-semibold text-gray-700"
                            >
                              {item.cost.toLocaleString("vi-VN")}đ
                            </td>
                          ))}
                        {periodMode === "quarter" &&
                          stats?.revenueByQuarter?.map((item, idx) => (
                            <td
                              key={idx}
                              className="px-2 py-2 text-right font-semibold text-gray-700"
                            >
                              {item.cost.toLocaleString("vi-VN")}đ
                            </td>
                          ))}
                        {periodMode === "year" &&
                          stats?.revenueByYear?.map((item, idx) => (
                            <td
                              key={idx}
                              className="px-2 py-2 text-right font-semibold text-gray-700"
                            >
                              {item.cost.toLocaleString("vi-VN")}đ
                            </td>
                          ))}
                        <td className="px-2 py-2 text-right font-extrabold text-gray-900 text-base ">
                          {(periodMode === "month"
                            ? stats?.revenueByMonth?.reduce(
                                (sum, item) => sum + item.cost,
                                0,
                              )
                            : periodMode === "quarter"
                              ? stats?.revenueByQuarter?.reduce(
                                  (sum, item) => sum + item.cost,
                                  0,
                                )
                              : stats?.revenueByYear?.reduce(
                                  (sum, item) => sum + item.cost,
                                  0,
                                )
                          )?.toLocaleString("vi-VN")}
                          đ
                        </td>
                      </tr>

                      {/* Dòng 3: Lợi Nhuận - XANH nếu DƯƠNG, ĐỎ nếu ÂM */}
                      <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-2 py-2 font-bold text-gray-900 sticky left-0 bg-white z-10 text-[11px]">
                          Lợi Nhuận
                        </td>
                        {periodMode === "month" &&
                          stats?.revenueByMonth?.map((item, idx) => (
                            <td
                              key={idx}
                              className={`px-2 py-2 text-right font-semibold ${
                                item.profit >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              } `}
                            >
                              {item.profit.toLocaleString("vi-VN")}đ
                            </td>
                          ))}
                        {periodMode === "quarter" &&
                          stats?.revenueByQuarter?.map((item, idx) => (
                            <td
                              key={idx}
                              className={`px-2 py-2 text-right font-semibold ${
                                item.profit >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              } `}
                            >
                              {item.profit.toLocaleString("vi-VN")}đ
                            </td>
                          ))}
                        {periodMode === "year" &&
                          stats?.revenueByYear?.map((item, idx) => (
                            <td
                              key={idx}
                              className={`px-2 py-2 text-right font-semibold ${
                                item.profit >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              } `}
                            >
                              {item.profit.toLocaleString("vi-VN")}đ
                            </td>
                          ))}
                        <td
                          className={`px-2 py-2 text-right font-extrabold text-base ${(() => {
                            const totalProfit =
                              periodMode === "month"
                                ? stats?.revenueByMonth?.reduce(
                                    (sum, item) => sum + item.profit,
                                    0,
                                  )
                                : periodMode === "quarter"
                                  ? stats?.revenueByQuarter?.reduce(
                                      (sum, item) => sum + item.profit,
                                      0,
                                    )
                                  : stats?.revenueByYear?.reduce(
                                      (sum, item) => sum + item.profit,
                                      0,
                                    );
                            return (totalProfit || 0) >= 0
                              ? "text-green-700"
                              : "text-red-600";
                          })()}`}
                        >
                          {(periodMode === "month"
                            ? stats?.revenueByMonth?.reduce(
                                (sum, item) => sum + item.profit,
                                0,
                              )
                            : periodMode === "quarter"
                              ? stats?.revenueByQuarter?.reduce(
                                  (sum, item) => sum + item.profit,
                                  0,
                                )
                              : stats?.revenueByYear?.reduce(
                                  (sum, item) => sum + item.profit,
                                  0,
                                )
                          )?.toLocaleString("vi-VN")}
                          đ
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cột phải: Biểu đồ Line Chart Thu-Chi-Lợi nhuận */}
              <div className="min-w-0 bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 p-6 lg:col-span-2">
                <div className="mb-6">
                  <h2 className="text-[18px] font-bold text-gray-900">
                    Biểu Đồ Thu - Chi - Lợi Nhuận
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Xu hướng tăng trưởng theo{" "}
                    {periodMode === "month"
                      ? "tháng"
                      : periodMode === "quarter"
                        ? "quý"
                        : "năm"}
                  </p>
                </div>

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={
                        periodMode === "month"
                          ? stats?.revenueByMonth || []
                          : periodMode === "quarter"
                            ? stats?.revenueByQuarter || []
                            : stats?.revenueByYear || []
                      }
                      margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey={
                          periodMode === "month"
                            ? "month"
                            : periodMode === "quarter"
                              ? "quarter"
                              : "year"
                        }
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#64748b",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#64748b",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        tickFormatter={(value) => {
                          if (value === 0) return "0";

                          const absValue = Math.abs(value);
                          const sign = value < 0 ? "-" : "";

                          if (absValue >= 1000000) {
                            const formatted = absValue / 1000000;
                            return `${sign}${formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(1)}M`;
                          }

                          if (absValue >= 1000) {
                            return `${sign}${(absValue / 1000).toFixed(0)}K`;
                          }

                          return `${sign}${absValue}`;
                        }}
                      />
                      <Tooltip
                        cursor={{
                          stroke: "#cbd5e1",
                          strokeWidth: 1,
                          strokeDasharray: "5 5",
                        }}
                        formatter={(value: number) =>
                          `${value.toLocaleString("vi-VN")}đ`
                        }
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                          fontWeight: "600",
                          fontSize: "12px",
                        }}
                      />

                      {/* Cột Tổng Thu */}
                      <Bar
                        name="Tổng Thu"
                        dataKey="revenue"
                        fill="#0EA5E9"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />

                      {/* Cột Tổng Chi */}
                      <Bar
                        name="Tổng Chi"
                        dataKey="cost"
                        fill="#F59E0B"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />

                      {/* Đường Lợi Nhuận */}
                      <Line
                        type="monotone"
                        name="Lợi Nhuận"
                        dataKey="profit"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                          fill: "#10B981",
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend tùy chỉnh */}
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#0EA5E9] rounded-sm"></div>
                    <span className="text-xs font-semibold text-gray-700">
                      Tổng Thu
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#F59E0B] rounded-sm"></div>
                    <span className="text-xs font-semibold text-gray-700">
                      Tổng Chi
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                    <span className="text-xs font-semibold text-gray-700">
                      Lợi Nhuận
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SECTION: THỐNG KÊ SẢN PHẨM THEO THÁNG / QUÝ / NĂM */}
            <section
              aria-labelledby="product-statistics-title"
              className="scroll-mt-20 grid grid-cols-1 xl:grid-cols-5 gap-6"
            >
              <div className="min-w-0 xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col gap-4 mb-5">
                  <div>
                    <h2
                      id="product-statistics-title"
                      className="text-lg font-bold text-gray-900"
                    >
                      Thống Kê Sản Phẩm Theo{" "}
                      {productMode === "month"
                        ? "Tháng"
                        : productMode === "quarter"
                          ? "Quý"
                          : "Năm"}
                    </h2>
                    <p className="text-xs text-gray-600 mt-1">
                      Top 5 theo số lượng bán • {productRangeLabel} • Chỉ tính
                      đơn đã giao
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      role="group"
                      aria-label="Kỳ thống kê sản phẩm"
                      className="flex bg-gray-100 rounded-lg p-1"
                    >
                      {(["month", "quarter", "year"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={productMode === mode}
                          onClick={() => setProductMode(mode)}
                          className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b51c00] ${productMode === mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                        >
                          {mode === "month"
                            ? "Tháng"
                            : mode === "quarter"
                              ? "Quý"
                              : "Năm"}
                        </button>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                      {productMode === "year" ? "Đến năm" : "Năm"}
                      <select
                        aria-label="Năm thống kê sản phẩm"
                        value={productYear}
                        onChange={(event) =>
                          setProductYear(Number(event.target.value))
                        }
                        className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-900 focus-visible:outline-[#b51c00]"
                      >
                        {(productStats?.availableYears || [productYear]).map(
                          (year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-3 sm:shrink-0">
                      <button
                        type="button"
                        onClick={handleExportProductStatistics}
                        disabled={
                          productsLoading ||
                          productsExporting ||
                          !currentProductStats?.products.length
                        }
                        className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
                      >
                        {productsExporting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <FileSpreadsheet size={16} />
                        )}
                        {productsExporting ? "Đang xuất..." : "Xuất Excel"}
                      </button>
                      <label className="flex min-w-0 items-center gap-2 text-xs font-semibold text-gray-600">
                        <select
                          aria-label="Sản phẩm hiển thị trên biểu đồ"
                          value={selectedProduct?.productId || ""}
                          onChange={(event) =>
                            setSelectedProductId(event.target.value)
                          }
                          disabled={
                            productsLoading ||
                            !currentProductStats?.products.length
                          }
                          className="w-44 max-w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-2 py-2 text-gray-900 focus-visible:outline-[#b51c00] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Tất cả</option>
                          {currentProductStats?.products.map((item) => (
                            <option key={item.productId} value={item.productId}>
                              {item.productName}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                {productsLoading ? (
                  <div
                    role="status"
                    className="flex items-center justify-center gap-2 h-64 text-sm text-gray-600"
                  >
                    <Loader2 className="size-5 animate-spin text-[#b51c00]" />{" "}
                    Đang tải thống kê sản phẩm...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-[11px] text-gray-600 bg-slate-50 uppercase font-bold border-b border-gray-100">
                        <tr>
                          <th
                            scope="col"
                            className="min-w-40 px-3 py-3 text-left sticky left-0 bg-slate-50 z-10"
                          >
                            Sản phẩm
                          </th>
                          {currentProductStats?.periods.map((period) => (
                            <th
                              scope="col"
                              key={period}
                              className="px-3 py-3 text-right whitespace-nowrap"
                            >
                              {period}
                            </th>
                          ))}
                          <th
                            scope="col"
                            className="px-3 py-3 text-right whitespace-nowrap"
                          >
                            Tổng cộng
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProductStats?.products.length ? (
                          currentProductStats.products.map((item, index) => {
                            const isSelected =
                              selectedProduct?.productId === item.productId;
                            return (
                              <tr
                                key={item.productId}
                                onClick={() =>
                                  setSelectedProductId(item.productId)
                                }
                                className={`cursor-pointer border-b border-gray-100 transition-colors ${isSelected ? "bg-red-50" : "hover:bg-gray-50"}`}
                              >
                                <th
                                  scope="row"
                                  className={`sticky left-0 z-10 px-3 py-3 text-left ${isSelected ? "bg-red-50" : "bg-white"}`}
                                >
                                  <button
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                      setSelectedProductId(item.productId)
                                    }
                                    className="cursor-pointer text-left rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b51c00]"
                                  >
                                    <span
                                      className={`block font-bold ${isSelected ? "text-[#b51c00]" : "text-gray-900"}`}
                                    >
                                      {index + 1}. {item.productName}
                                    </span>
                                    <span className="block text-[11px] font-normal text-gray-600 mt-1">
                                      Đã bán:{" "}
                                      {item.totalQuantity.toLocaleString(
                                        "vi-VN",
                                      )}{" "}
                                      •{" "}
                                      {isSelected ? "Đang xem" : "Xem biểu đồ"}
                                    </span>
                                  </button>
                                </th>
                                {currentProductStats.periods.map((period) => (
                                  <td
                                    key={period}
                                    className="px-3 py-3 text-right font-semibold text-gray-700 whitespace-nowrap"
                                  >
                                    {item.periods[
                                      period
                                    ].revenue.toLocaleString("vi-VN")}
                                    đ
                                  </td>
                                ))}
                                <td className="px-3 py-3 text-right font-extrabold text-gray-900 whitespace-nowrap">
                                  {item.totalRevenue.toLocaleString("vi-VN")}đ
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={
                                (currentProductStats?.periods.length || 0) + 2
                              }
                              className="px-3 py-12 text-center text-gray-600"
                            >
                              Chưa có sản phẩm bán trong khoảng thời gian này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div
                className="min-w-0 xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6"
                aria-busy={productsLoading}
              >
                <h2 className="text-lg font-bold text-gray-900">
                  Số Lượng Bán Theo{" "}
                  {productMode === "month"
                    ? "Tháng"
                    : productMode === "quarter"
                      ? "Quý"
                      : "Năm"}
                </h2>
                <p
                  aria-live="polite"
                  className="text-sm font-semibold text-[#b51c00] mt-1"
                >
                  {productsLoading
                    ? "Đang tải..."
                    : chartProducts.length
                      ? productChartTitle
                      : "Chưa có sản phẩm"}
                </p>
                {!productsLoading && chartProducts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mt-5 mb-6">
                      <div className="rounded-lg bg-sky-50 p-3">
                        <p className="text-xs text-gray-600">Tổng số lượng</p>
                        <p className="text-xl font-bold text-sky-700 mt-1">
                          {productChartQuantity.toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <div className="rounded-lg bg-red-50 p-3">
                        <p className="text-xs text-gray-600">
                          {selectedProduct
                            ? "Doanh thu sản phẩm"
                            : "Doanh thu Top 5"}
                        </p>
                        <p className="text-lg font-bold text-[#b51c00] mt-1 break-words">
                          {productChartRevenue.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    </div>
                    <div
                      className="h-72 w-full"
                      role="img"
                      aria-label={`Số lượng ${productChartTitle} bán theo ${productModeLabel}, ${productRangeLabel}`}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={productChartData}
                          margin={{ top: 16, right: 8, left: 0, bottom: 8 }}
                          accessibilityLayer
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="period"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#475569", fontSize: 11 }}
                            minTickGap={8}
                          />
                          <YAxis
                            allowDecimals={false}
                            domain={[0, "auto"]}
                            axisLine={false}
                            tickLine={false}
                            width={45}
                            tick={{ fill: "#475569", fontSize: 11 }}
                          />
                          <Tooltip
                            cursor={{ fill: "#f0f9ff" }}
                            formatter={(value) => [
                              `${Number(value).toLocaleString("vi-VN")} sản phẩm`,
                              "Đã bán",
                            ]}
                            labelFormatter={(label) =>
                              `${label} • ${productRangeLabel}`
                            }
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid #e2e8f0",
                              fontSize: 12,
                            }}
                          />
                          <Bar
                            dataKey="quantity"
                            name="Đã bán"
                            fill="#0EA5E9"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={48}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <dl className="sr-only">
                      {productChartData.map((item) => (
                        <div key={item.period}>
                          <dt>{item.period}</dt>
                          <dd>{item.quantity} sản phẩm</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="text-xs text-gray-600 text-center mt-4">
                      Số lượng sản phẩm • {productRangeLabel}
                    </p>
                  </>
                ) : (
                  <div
                    role="status"
                    className="h-80 flex items-center justify-center text-sm text-gray-600"
                  >
                    {productsLoading ? (
                      <Loader2
                        className="size-6 animate-spin text-[#b51c00]"
                        aria-label="Đang tải biểu đồ"
                      />
                    ) : (
                      "Biểu đồ sẽ hiển thị khi có dữ liệu bán hàng."
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* 3. SECTION: Thống Kê Theo Nhân Viên */}
            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">
                    Thống Kê Theo Nhân Viên
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Doanh thu từ đơn hàng được xử lý bởi nhân viên
                  </p>
                </div>
                <button
                  onClick={handleExportRevenueByStaff}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    !stats?.revenueByStaff || stats.revenueByStaff.length === 0
                  }
                >
                  <FileSpreadsheet size={16} />
                  Xuất Excel
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[11px] text-gray-500 bg-[#f8fafc] uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Nhân Viên</th>
                      <th className="px-3 py-2 text-right">2024</th>
                      <th className="px-3 py-2 text-right">2025</th>
                      <th className="px-3 py-2 text-right">2026</th>
                      <th className="px-3 py-2 text-right">Tổng Cộng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.revenueByStaff &&
                    stats.revenueByStaff.length > 0 ? (
                      stats.revenueByStaff.map((item, idx) => {
                        const total = Object.values(item.years).reduce(
                          (sum, val) => sum + val,
                          0,
                        );
                        return (
                          <tr
                            key={idx}
                            className="border-b border-gray-50 hover:bg-gray-50/50"
                          >
                            <td className="px-3 py-3 font-bold text-gray-900">
                              {item.staffName}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-700">
                              {(item.years[2024] || 0).toLocaleString("vi-VN")}đ
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-700">
                              {(item.years[2025] || 0).toLocaleString("vi-VN")}đ
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-700">
                              {(item.years[2026] || 0).toLocaleString("vi-VN")}đ
                            </td>
                            <td className="px-3 py-3 text-right font-extrabold text-gray-900">
                              {total.toLocaleString("vi-VN")}đ
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-8 text-center text-gray-400"
                        >
                          Chưa có dữ liệu nhân viên
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. SECTION: Thống Kê Theo Khách Hàng */}
            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">
                    Thống Kê Theo Khách Hàng
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {customerMode === "year"
                      ? "Top 10 khách hàng theo các năm"
                      : `Top 10 khách hàng theo quý năm ${customerYear}`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Tabs chọn chế độ */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setCustomerMode("year")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                        customerMode === "year"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Năm
                    </button>
                    <button
                      onClick={() => setCustomerMode("quarter")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                        customerMode === "quarter"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Quý
                    </button>
                  </div>

                  {/* Chọn năm (chỉ hiện khi chế độ Quý) */}
                  {customerMode === "quarter" && (
                    <select
                      value={customerYear}
                      onChange={(e) => setCustomerYear(Number(e.target.value))}
                      className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-[#b51c00] focus:border-[#b51c00] px-2 py-1.5 outline-none font-semibold"
                    >
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  )}

                  {/* Nút xuất Excel */}
                  <button
                    onClick={handleExportRevenueByCustomer}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      (customerMode === "year" &&
                        (!stats?.revenueByCustomerYear ||
                          stats.revenueByCustomerYear.length === 0)) ||
                      (customerMode === "quarter" &&
                        (!stats?.revenueByCustomerQuarter ||
                          stats.revenueByCustomerQuarter.length === 0))
                    }
                  >
                    <FileSpreadsheet size={16} />
                    Xuất Excel
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[11px] text-gray-500 bg-[#f8fafc] uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left sticky left-0 bg-[#f8fafc] z-10">
                        Khách Hàng
                      </th>
                      {customerMode === "year" &&
                        ["2024", "2025", "2026"].map((year) => (
                          <th key={year} className="px-3 py-2 text-right">
                            {year}
                          </th>
                        ))}
                      {customerMode === "quarter" &&
                        ["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
                          <th key={quarter} className="px-3 py-2 text-right">
                            {quarter}
                          </th>
                        ))}
                      <th className="px-3 py-2 text-right">Tổng Cộng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerMode === "year" &&
                    stats?.revenueByCustomerYear &&
                    stats.revenueByCustomerYear.length > 0 ? (
                      stats.revenueByCustomerYear.map((item, idx) => {
                        const total = Object.values(item.years).reduce(
                          (sum, val) => sum + val,
                          0,
                        );
                        return (
                          <tr
                            key={idx}
                            className="border-b border-gray-50 hover:bg-gray-50/50"
                          >
                            <td className="px-3 py-3 font-bold text-gray-900 sticky left-0 bg-white z-10">
                              {item.customerName}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-700">
                              {(item.years[2024] || 0).toLocaleString("vi-VN")}đ
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-700">
                              {(item.years[2025] || 0).toLocaleString("vi-VN")}đ
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-700">
                              {(item.years[2026] || 0).toLocaleString("vi-VN")}đ
                            </td>
                            <td className="px-3 py-3 text-right font-extrabold text-gray-900">
                              {total.toLocaleString("vi-VN")}đ
                            </td>
                          </tr>
                        );
                      })
                    ) : customerMode === "quarter" &&
                      stats?.revenueByCustomerQuarter &&
                      stats.revenueByCustomerQuarter.length > 0 ? (
                      stats.revenueByCustomerQuarter.map((item, idx) => {
                        const total = Object.values(item.quarters).reduce(
                          (sum, val) => sum + val,
                          0,
                        );
                        return (
                          <tr
                            key={idx}
                            className="border-b border-gray-50 hover:bg-gray-50/50"
                          >
                            <td className="px-3 py-3 font-bold text-gray-900 sticky left-0 bg-white z-10">
                              {item.customerName}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-700">
                              {(item.quarters["Q1"] || 0).toLocaleString(
                                "vi-VN",
                              )}
                              đ
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-700">
                              {(item.quarters["Q2"] || 0).toLocaleString(
                                "vi-VN",
                              )}
                              đ
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-700">
                              {(item.quarters["Q3"] || 0).toLocaleString(
                                "vi-VN",
                              )}
                              đ
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-700">
                              {(item.quarters["Q4"] || 0).toLocaleString(
                                "vi-VN",
                              )}
                              đ
                            </td>
                            <td className="px-3 py-3 text-right font-extrabold text-gray-900">
                              {total.toLocaleString("vi-VN")}đ
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={customerMode === "year" ? 5 : 6}
                          className="px-3 py-8 text-center text-gray-400"
                        >
                          Chưa có dữ liệu khách hàng
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatisticPage;

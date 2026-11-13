import { useState, useEffect } from "react";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { useAdminStatisticStore } from "@/stores/useAdminStatisticStore";
import AdminHeader from "@/components/admin/AdminHeader";
import { adminExportService } from "@/services/adminExportService";
import { toast } from "sonner";

import {
  ComposedChart,
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

  const { stats, loading, fetchStats } = useAdminStatisticStore();

  useEffect(() => {
    if (customerMode === "quarter") {
      fetchStats(undefined, undefined, undefined, customerYear);
    } else {
      fetchStats();
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

  const handleExportRevenueByProductQuarter = async () => {
    if (
      !stats?.revenueByProductQuarter ||
      stats.revenueByProductQuarter.length === 0
    ) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    try {
      await adminExportService.exportDashboardRevenueByProductQuarter(
        stats.revenueByProductQuarter,
        new Date().getFullYear(),
      );
      toast.success("Xuất Excel thành công");
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);
      toast.error("Lỗi khi xuất file Excel");
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
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
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
              <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 p-6 col-span-3">
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
              <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 p-6 col-span-2">
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

            {/* 2. SECTION: THỐNG KÊ SẢN PHẨM THEO QUÝ */}
            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">
                    Thống Kê Sản Phẩm Theo Quý
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Top 5 sản phẩm bán chạy theo quý
                  </p>
                </div>
                <button
                  onClick={handleExportRevenueByProductQuarter}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    !stats?.revenueByProductQuarter ||
                    stats.revenueByProductQuarter.length === 0
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
                      <th className="px-3 py-2 text-left">Sản Phẩm</th>
                      <th className="px-3 py-2 text-right">Q1</th>
                      <th className="px-3 py-2 text-right">Q2</th>
                      <th className="px-3 py-2 text-right">Q3</th>
                      <th className="px-3 py-2 text-right">Q4</th>
                      <th className="px-3 py-2 text-right">Tổng Cộng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.revenueByProductQuarter &&
                    stats.revenueByProductQuarter.length > 0 ? (
                      stats.revenueByProductQuarter.map((item, idx) => {
                        const total = Object.values(item.quarters).reduce(
                          (sum, val) => sum + val,
                          0,
                        );
                        return (
                          <tr
                            key={idx}
                            className="border-b border-gray-50 hover:bg-gray-50/50"
                          >
                            <td className="px-3 py-3 font-bold text-gray-900">
                              {item.productName}
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
                          colSpan={6}
                          className="px-3 py-8 text-center text-gray-400"
                        >
                          Chưa có dữ liệu sản phẩm
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

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

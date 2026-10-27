import { useState, useEffect } from "react";
import {
  Users,
  Utensils,
  LayoutList,
  ShoppingCart,
  Loader2,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAdminDashboardStore } from "@/stores/useAdminDashboardStore";
import AdminHeader from "@/components/admin/AdminHeader";
import { Link } from "react-router-dom";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// Tính thời gian "X phút trước", "X giờ trước", "X ngày trước"
const getTimeAgo = (createdAt: string): string => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
};

const DashboardPage = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pieFilter, setPieFilter] = useState("Cả năm");

  // Tách biệt trạng thái loading cục bộ cho biểu đồ tròn
  const [isPieLoading, setIsPieLoading] = useState(false);

  const { stats, loading, fetchStats, fetchOrderStatusByMonth } =
    useAdminDashboardStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterRevenue = () => {
    if (startDate && endDate) {
      fetchStats(startDate, endDate);
    }
  };

  const handlePieFilterChange = async (value: string) => {
    setPieFilter(value);
    setIsPieLoading(true); // Bật loading riêng cho Pie Chart

    try {
      if (value === "Cả năm") {
        await fetchOrderStatusByMonth("all");
      } else {
        const monthNum = value.replace("Tháng ", "");
        await fetchOrderStatusByMonth(monthNum);
      }
    } finally {
      setIsPieLoading(false);
    }
  };

  const orderPieData = [
    {
      name: "Chờ xử lý",
      value: stats?.orderStatus?.pending || 0,
      color: "#F59E0B",
    },
    {
      name: "Đang xử lý",
      value: stats?.orderStatus?.processing || 0,
      color: "#06B6D4",
    },
    {
      name: "Đang giao",
      value: stats?.orderStatus?.shipped || 0,
      color: "#3B82F6",
    },
    {
      name: "Đã giao",
      value: stats?.orderStatus?.delivered || 0,
      color: "#10B981",
    },
    {
      name: "Đã hủy",
      value: stats?.orderStatus?.cancelled || 0,
      color: "#EF4444",
    },
  ];

  // Logic kiểm tra xem tháng được chọn có dữ liệu hay không
  const hasPieData = orderPieData.some((item) => item.value > 0);

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Dashboard", isCurrentPage: true },
        ]}
      />

      <div className="flex flex-col gap-8 p-6 md:p-8 max-w-[1600px] mx-auto">
        {/* TITLE */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Đặc Sản Ba Miền Admin Dashboard
          </p>
        </div>

        {/* CẢI TIẾN: Chỉ hiện Loader toàn cục khi lần đầu tiên vào trang (chưa có data overview) */}
        {loading && !stats?.overview?.totalCustomers ? (
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="w-10 h-10 animate-spin text-[#b51c00]" />
          </div>
        ) : (
          <>
            {/* 1. SECTION: 4 STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center gap-4 hover:border-[#b51c00]/30 transition-colors">
                <div className="w-14 h-14 rounded-[12px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    Khách hàng
                  </p>
                  <h3 className="text-2xl font-black text-gray-900">
                    {stats?.overview?.totalCustomers || 0}
                  </h3>
                </div>
              </div>

              <div className="bg-white rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center gap-4 hover:border-[#b51c00]/30 transition-colors">
                <div className="w-14 h-14 rounded-[12px] bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <ShoppingCart size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    Tổng đơn hàng
                  </p>
                  <h3 className="text-2xl font-black text-gray-900">
                    {stats?.overview?.totalOrders || 0}
                  </h3>
                </div>
              </div>

              <div className="bg-white rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center gap-4 hover:border-[#b51c00]/30 transition-colors">
                <div className="w-14 h-14 rounded-[12px] bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                  <Utensils size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    Món ăn
                  </p>
                  <h3 className="text-2xl font-black text-gray-900">
                    {stats?.overview?.totalProducts || 0}
                  </h3>
                </div>
              </div>

              <div className="bg-white rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center gap-4 hover:border-[#b51c00]/30 transition-colors">
                <div className="w-14 h-14 rounded-[12px] bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <LayoutList size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    Danh mục
                  </p>
                  <h3 className="text-2xl font-black text-gray-900">
                    {stats?.overview?.totalCategories || 0}
                  </h3>
                </div>
              </div>
            </div>

            {/* 2. SECTION: DOANH THU TỔNG QUAN (LINE CHART) */}
            <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 p-6 md:p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Doanh Thu Tổng Quan
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Biểu đồ tăng trưởng doanh thu theo tháng
                  </p>
                </div>
              </div>

              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats?.monthlyRevenue || []}
                    margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                      // ✅ HÀM ĐỘNG: Tự nhận biết giá trị để hiển thị K hoặc M hoặc chữ đ
                      tickFormatter={(value) => {
                        if (value === 0) return "0đ";

                        // Nếu dữ liệu lớn hơn hoặc bằng 1 triệu, rút gọn thành M (Ví dụ: 1.5M, 2M)
                        if (value >= 1000000) {
                          const formatted = value / 1000000;
                          // Nếu là số tròn (ví dụ 2.0M) thì hiện 2M, nếu lẻ (ví dụ 1.5M) thì giữ 1 chữ số thập phân
                          return `${formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(1)}M`;
                        }

                        // Nếu dữ liệu dưới 1 triệu, rút gọn thành K (Ví dụ: 300K, 600K)
                        if (value >= 1000) {
                          return `${(value / 1000).toFixed(0)}K`;
                        }

                        return `${value}đ`;
                      }}
                    />
                    <Tooltip
                      cursor={{
                        stroke: "#cbd5e1",
                        strokeWidth: 1,
                        strokeDasharray: "5 5",
                      }}
                      formatter={(value: number) => [
                        `${value.toLocaleString("vi-VN")}đ`,
                        "Doanh thu",
                      ]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        fontWeight: "600",
                      }}
                    />

                    <Line
                      type="monotone"
                      name="Doanh thu"
                      dataKey="revenue"
                      stroke="#0EA5E9"
                      strokeWidth={4}
                      dot={{
                        r: 4,
                        fill: "#ffffff",
                        strokeWidth: 3,
                        stroke: "#0EA5E9",
                      }}
                      activeDot={{ r: 7, strokeWidth: 0, fill: "#0EA5E9" }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. SECTION: GRID 2 CỘT: PIE CHART & TÌNH HÌNH HIỆN TẠI */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Cột trái: Pie Chart Trạng Thái (1/3) */}
              <div className="xl:col-span-1 bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[18px] font-bold text-gray-900">
                    Trạng Thái Đơn
                  </h2>
                  <select
                    value={pieFilter}
                    onChange={(e) => handlePieFilterChange(e.target.value)}
                    disabled={isPieLoading}
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-[#b51c00] focus:border-[#b51c00] px-2 py-1 outline-none font-semibold disabled:opacity-50"
                  >
                    <option value="Cả năm">Cả năm</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={`Tháng ${i + 1}`}>
                        Tháng {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-grow flex flex-col justify-center min-h-[300px]">
                  {isPieLoading && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                      <Loader2 className="w-8 h-8 animate-spin text-[#b51c00]" />
                    </div>
                  )}

                  {!hasPieData && !isPieLoading ? (
                    <div className="flex flex-col items-center justify-center text-gray-400 my-auto">
                      <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">
                        pie_chart
                      </span>
                      <p className="font-medium text-sm">Chưa có dữ liệu</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={orderPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              dataKey="value"
                              stroke="none"
                            >
                              {orderPieData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>

                            {/* ✅ CHÈN TỔNG SỐ ĐƠN VÀO GIỮA VÒNG NHẪN */}
                            <text
                              x="50%"
                              y="48%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-xs font-medium fill-gray-500"
                            >
                              Tổng đơn
                            </text>
                            <text
                              x="50%"
                              y="58%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-xl font-black fill-gray-900"
                            >
                              {orderPieData.reduce(
                                (sum, item) => sum + item.value,
                                0,
                              )}
                            </text>

                            <Tooltip
                              contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                                fontSize: "12px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend rút gọn dưới Pie chart */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {orderPieData.map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              ></span>
                              <span className="text-gray-600 truncate max-w-[70px]">
                                {entry.name}
                              </span>
                            </div>
                            <span className="font-bold text-gray-900">
                              {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Cột phải: Recent Orders & Top Products (2/3) */}
              <div className="xl:col-span-2 flex flex-col gap-6">
                {/* Bảng Đơn Hàng Mới Nhất */}
                <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 p-6 flex-grow">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                      <Clock size={20} className="text-[#b51c00]" /> Đơn Hàng
                      Mới Nhất
                    </h2>
                    <Link
                      to="/admin/orders"
                      className="text-sm font-semibold text-[#b51c00] hover:underline flex items-center gap-1"
                    >
                      Xem tất cả <ArrowRight size={14} />
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[12px] text-gray-500 bg-[#f8fafc] uppercase font-bold border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Mã Đơn</th>
                          <th className="px-4 py-3">Khách Hàng</th>
                          <th className="px-4 py-3 text-right">Tổng Tiền</th>
                          <th className="px-4 py-3 text-center rounded-tr-lg">
                            Trạng Thái
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.recentOrders &&
                        stats.recentOrders.length > 0 ? (
                          stats.recentOrders.map((order, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-gray-50 hover:bg-gray-50/50"
                            >
                              <td className="px-4 py-3 font-bold text-gray-900">
                                #{order._id.slice(-6).toUpperCase()}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-gray-800">
                                  {order.customerName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {getTimeAgo(order.createdAt)}
                                </p>
                              </td>
                              <td className="px-4 py-3 font-bold text-[#b51c00] text-right">
                                {order.totalAmount.toLocaleString("vi-VN")}đ
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold ${
                                    order.orderStatus === "Delivered"
                                      ? "bg-green-100 text-green-700"
                                      : order.orderStatus === "Pending"
                                        ? "bg-amber-100 text-amber-700"
                                        : order.orderStatus === "Cancelled"
                                          ? "bg-red-100 text-red-700"
                                          : order.orderStatus === "Processing"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-cyan-100 text-cyan-700"
                                  }`}
                                >
                                  {order.orderStatus === "Pending"
                                    ? "Chờ xử lý"
                                    : order.orderStatus === "Processing"
                                      ? "Đang xử lý"
                                      : order.orderStatus === "Shipped"
                                        ? "Đang giao"
                                        : order.orderStatus === "Delivered"
                                          ? "Đã giao"
                                          : "Đã hủy"}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-8 text-center text-gray-400"
                            >
                              Chưa có đơn hàng nào
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. SECTION: BỘ LỌC DOANH THU & TOP SẢN PHẨM */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 p-6 md:p-8">
                <h2 className="text-[18px] font-bold text-gray-900 mb-6">
                  Lọc Doanh Thu Cụ Thể
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] outline-none"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleFilterRevenue}
                  className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg transition-colors mb-6 shadow-sm"
                >
                  Tra cứu dữ liệu
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-xs font-bold text-green-700 uppercase mb-1">
                      Tổng Doanh Thu
                    </p>
                    <h3 className="text-xl font-black text-gray-900">
                      {stats?.revenueByDateRange?.totalRevenue?.toLocaleString(
                        "vi-VN",
                      ) || 0}{" "}
                      đ
                    </h3>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-700 uppercase mb-1">
                      Số Đơn Hàng
                    </p>
                    <h3 className="text-xl font-black text-gray-900">
                      {stats?.revenueByDateRange?.totalOrders || 0}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Top Món Ăn Bán Chạy */}
              <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 p-6 md:p-8">
                <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2 mb-6">
                  <TrendingUp size={20} className="text-[#b51c00]" /> Top Sản
                  Phẩm Bán Chạy
                </h2>
                <div className="flex flex-col gap-4">
                  {stats?.topProducts && stats.topProducts.length > 0 ? (
                    stats.topProducts.map((prod, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-100 text-orange-700"}`}
                          >
                            #{idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {prod.name}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              Đã bán: {prod.sold}
                            </p>
                          </div>
                        </div>
                        <div className="font-bold text-[#b51c00] text-sm">
                          {prod.revenue.toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      Chưa có dữ liệu sản phẩm bán chạy
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ShoppingBag,
  TrendingUp,
  Package,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAdminCustomerStore } from "@/stores/useAdminCustomerStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import AdminHeader from "@/components/admin/AdminHeader";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const CustomerReport = () => {
  const { user } = useAdminAuthStore();
  const { report, loading, fetchReport } = useAdminCustomerStore();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const canView = hasPermission(user, "customers_view");

  useEffect(() => {
    const loadReport = async () => {
      if (canView) {
        await fetchReport();
        setIsInitialLoad(false);
      }
    };
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Báo cáo khách hàng", isCurrentPage: true },
        ]}
      />
    );
  }

  const showSkeleton = isInitialLoad && loading;
  const showData = !isInitialLoad && report;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Stat cards data
  const statCards = [
    {
      title: "Tổng khách hàng",
      value: report?.summary.totalCustomers || 0,
      icon: Users,
      color: "bg-blue-500",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Đang hoạt động",
      value: report?.summary.activeCount || 0,
      icon: UserCheck,
      color: "bg-green-500",
      bgLight: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Đã khóa",
      value: report?.summary.inactiveCount || 0,
      icon: UserX,
      color: "bg-red-500",
      bgLight: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      title: "Khách hàng mới (30 ngày)",
      value: report?.summary.newCustomersLast30Days || 0,
      icon: UserPlus,
      color: "bg-purple-500",
      bgLight: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Tổng đơn hàng",
      value: report?.summary.totalOrders || 0,
      icon: ShoppingBag,
      color: "bg-orange-500",
      bgLight: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      title: "Tổng doanh thu",
      value: formatCurrency(report?.summary.totalRevenue || 0),
      icon: TrendingUp,
      color: "bg-emerald-500",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
      isRevenue: true,
    },
  ];

  // Prepare data for Recharts - Age Distribution (Pie Chart)
  const ageChartData = showData
    ? Object.entries(report.ageDistribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const AGE_COLORS = [
    "#3b82f6", // blue-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#f59e0b", // amber-500
    "#10b981", // emerald-500
    "#06b6d4", // cyan-500
    "#6b7280", // gray-500
  ];

  // Prepare data for Monthly Registrations (Line Chart)
  const monthlyChartData = showData
    ? Object.entries(report.monthlyRegistrations).map(([month, count]) => ({
        month: `T${month.split("/")[0]}`,
        count,
      }))
    : [];

  // Custom Tooltip for Age Distribution
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">
            {payload[0].name}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-bold text-blue-600">{payload[0].value}</span>{" "}
            khách hàng
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Monthly Registrations
  const CustomLineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">
            {payload[0].payload.month}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-bold text-purple-600">
              {payload[0].value}
            </span>{" "}
            đăng ký
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Báo cáo khách hàng", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* TITLE */}
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 mb-2 tracking-tight">
            Báo cáo khách hàng
          </h1>
          <p className="text-sm text-gray-600">
            Tổng quan về khách hàng, độ tuổi, sở thích và xu hướng
          </p>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              {showSkeleton ? (
                <div className="animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <div
                      className={`${stat.bgLight} ${stat.textColor} p-2 rounded-lg`}
                    >
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p
                    className={`text-[28px] font-bold ${stat.isRevenue ? "text-emerald-600" : "text-gray-900"}`}
                  >
                    {stat.value}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* AGE DISTRIBUTION & MONTHLY REGISTRATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Distribution - Pie Chart */}
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-[18px] font-bold text-gray-900">
                Phân bố độ tuổi
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Tỷ lệ phân bố khách hàng theo nhóm tuổi
              </p>
            </div>
            <div className="p-6">
              {showSkeleton ? (
                <div className="h-[320px] flex items-center justify-center">
                  <div className="animate-pulse">
                    <div className="w-48 h-48 bg-gray-200 rounded-full mx-auto"></div>
                  </div>
                </div>
              ) : showData && ageChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={ageChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ageChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={AGE_COLORS[index % AGE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex items-center justify-center">
                  <p className="text-center text-gray-500">Không có dữ liệu</p>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Registrations - Line Chart */}
          <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-[18px] font-bold text-gray-900">
                Đăng ký theo tháng (6 tháng gần nhất)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Xu hướng đăng ký khách hàng mới
              </p>
            </div>
            <div className="p-6">
              {showSkeleton ? (
                <div className="h-[320px] flex items-center justify-center">
                  <div className="animate-pulse space-y-4 w-full">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : showData && monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      stroke="#d1d5db"
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      stroke="#d1d5db"
                    />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: "#8b5cf6", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex items-center justify-center">
                  <p className="text-center text-gray-500">Không có dữ liệu</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP PRODUCTS */}
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-700" />
              <h2 className="text-[18px] font-bold text-gray-900">
                Sản phẩm được khách hàng yêu thích (Top 10)
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Dựa trên số lượng bán và số đơn hàng đã hoàn thành
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[12px] text-gray-500 bg-[#f1f5f9] uppercase font-bold border-b border-gray-200 tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    #
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Sản phẩm
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Danh mục
                  </th>
                  <th scope="col" className="px-6 py-4 text-center">
                    Số lượng bán
                  </th>
                  <th scope="col" className="px-6 py-4 text-center">
                    Số đơn hàng
                  </th>
                  <th scope="col" className="px-6 py-4 text-center">
                    Xu hướng
                  </th>
                </tr>
              </thead>
              <tbody>
                {showSkeleton ? (
                  [...Array(5)].map((_, index) => (
                    <tr
                      key={index}
                      className="animate-pulse bg-white border-b border-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-gray-200 rounded w-20 mx-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : showData && report.topProducts.length > 0 ? (
                  report.topProducts.map((product, index) => (
                    <tr
                      key={product.productId}
                      className="bg-white border-b border-gray-50 hover:bg-[#f8fafc] transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.thumbnail ? (
                            <img
                              src={product.thumbnail}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">
                              {product.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-gray-900">
                          {product.totalQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-700">
                          {product.orderCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {index < 3 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-xs font-bold">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Hot
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Tốt
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Chưa có dữ liệu sản phẩm</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReport;

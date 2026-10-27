import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Loader2,
  MessageSquareText,
  Users,
  BarChart3,
  Calendar,
  PlayCircle,
  PauseCircle,
  Download,
  Edit,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAdminSurveyStore } from "@/stores/useAdminSurveyStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

// Màu sắc chuyên nghiệp cho CRM/Analytics Dashboard
const COLORS = [
  "#0EA5E9", // Sky 500 - Primary
  "#8B5CF6", // Violet 500 - Secondary
  "#10B981", // Emerald 500 - Success
  "#F59E0B", // Amber 500 - Warning
  "#EF4444", // Red 500 - Error
  "#06B6D4", // Cyan 500 - Info
  "#EC4899", // Pink 500 - Accent
  "#6366F1", // Indigo 500 - Deep
];

const SurveyDetail = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { user } = useAdminAuthStore();
  const {
    currentSurvey,
    getSurveyDetail,
    getStatistics,
    getResponses,
  } = useAdminSurveyStore();

  const [statistics, setStatistics] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [responsesPage, setResponsesPage] = useState(1);
  const [responsesTotalPages, setResponsesTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<"statistics" | "responses">(
    "statistics",
  );
  const [loading, setLoading] = useState(true);

  const canView = hasPermission(user, "surveys_view");
  const canEdit = hasPermission(user, "surveys_edit");

  useEffect(() => {
    if (canView && surveyId) {
      const loadData = async () => {
        try {
          setLoading(true);
          await getSurveyDetail(surveyId);
          const statsData = await getStatistics(surveyId);
          setStatistics(statsData);

          if (statsData.totalResponses > 0) {
            const responsesData = await getResponses(surveyId, 1, 20);
            setResponses(responsesData.data);
            setResponsesTotalPages(responsesData.totalPages);
            setResponsesPage(1);
          }
        } catch {
          // Error handled in store
        } finally {
          setLoading(false);
        }
      };

      loadData();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId, canView]);

  const loadResponses = async (page: number) => {
    if (!surveyId) return;

    try {
      const data = await getResponses(surveyId, page, 20);
      setResponses(data.data);
      setResponsesTotalPages(data.totalPages);
      setResponsesPage(page);
    } catch {
      // Error handled in store
    }
  };

  const handleExportCSV = () => {
    if (!currentSurvey || !statistics) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    try {
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
      csvContent += `Khảo sát: ${currentSurvey.title}\n`;
      csvContent += `Mô tả: ${currentSurvey.description || "N/A"}\n`;
      csvContent += `Tổng phản hồi: ${statistics.totalResponses}\n`;
      csvContent += `Ngày tạo: ${new Date(currentSurvey.createdAt).toLocaleDateString("vi-VN")}\n\n`;

      statistics.questionStats.forEach((stat: any, index: number) => {
        csvContent += `\nCâu hỏi ${index + 1}: ${stat.questionText}\n`;
        csvContent += `Loại: ${stat.type === "single_choice" ? "Trắc nghiệm" : "Tự luận"}\n`;
        csvContent += `Tổng câu trả lời: ${stat.totalAnswers}\n\n`;

        if (stat.type === "single_choice" && stat.optionStats) {
          csvContent += "Đáp án,Số lượng,Tỷ lệ\n";
          stat.optionStats.forEach((option: any) => {
            csvContent += `"${option.option}",${option.count},${option.percentage}%\n`;
          });
        } else if (stat.textAnswers) {
          csvContent += "Câu trả lời tự luận:\n";
          stat.textAnswers.forEach((answer: string, i: number) => {
            csvContent += `${i + 1},"${answer}"\n`;
          });
        }
        csvContent += "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `khao-sat-${currentSurvey.title.replace(/\s+/g, "-")}-${Date.now()}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Xuất báo cáo thành công");
    } catch (error) {
      console.error("Lỗi khi xuất CSV:", error);
      toast.error("Không thể xuất báo cáo");
    }
  };

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Quản lý khảo sát", href: "/admin/surveys" },
          { label: "Chi tiết khảo sát", isCurrentPage: true },
        ]}
      />
    );
  }

  if (loading) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#b51c00]" />
      </div>
    );
  }

  if (!currentSurvey) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageSquareText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Không tìm thấy khảo sát</p>
          <button
            onClick={() => navigate("/admin/surveys")}
            className="mt-4 px-4 py-2 bg-[#b51c00] text-white rounded-lg hover:bg-[#8e1400] transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Quản lý khảo sát", href: "/admin/surveys" },
    { label: currentSurvey.title, isCurrentPage: true },
  ];

  // Tỷ lệ hoàn thành từ backend
  const completionRate = statistics?.completionRate || "0.0";
  const totalCustomers = statistics?.totalCustomers || 0;

  const canEditSurvey =
    canEdit &&
    (currentSurvey.responseCount === 0 || statistics?.totalResponses === 0);

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader items={breadcrumbItems} />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <AdminPageHeading
            title={currentSurvey.title}
            subtitle={
              currentSurvey.description || "Chi tiết và thống kê khảo sát"
            }
          />

          <div className="flex items-center gap-3 flex-shrink-0">
            {canEditSurvey && (
              <button
                onClick={() => navigate(`/admin/survey/edit/${surveyId}`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:border-sky-500 hover:text-sky-600 hover:bg-sky-50 transition-all font-semibold shadow-sm"
              >
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </button>
            )}
            {statistics?.totalResponses > 0 && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                <Download className="w-4 h-4" />
                Xuất báo cáo
              </button>
            )}
          </div>
        </div>

        {/* Survey Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {currentSurvey.title}
              </h1>
              {currentSurvey.description && (
                <p className="text-slate-600">{currentSurvey.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Tạo ngày{" "}
                  {new Date(currentSurvey.createdAt).toLocaleDateString(
                    "vi-VN",
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Người tạo:{" "}
                  {currentSurvey.createdBy?.userId?.displayName || "Không rõ"}
                </div>
              </div>
              {!canEditSurvey && statistics?.totalResponses > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <MessageSquareText className="w-4 h-4" />
                  Khảo sát đã có {statistics.totalResponses} lượt trả lời, không
                  thể chỉnh sửa cấu trúc câu hỏi
                </div>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-md transition-all ${
                currentSurvey.status === "active"
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600"
                  : "bg-gradient-to-r from-slate-400 to-slate-500 text-white hover:from-slate-500 hover:to-slate-600"
              }`}
            >
              {currentSurvey.status === "active" ? (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Đang hoạt động
                </>
              ) : (
                <>
                  <PauseCircle className="w-4 h-4" />
                  Đã đóng
                </>
              )}
            </span>
          </div>
        </div>

        {/* KPI Stats Cards - Màu chuyên nghiệp cho CRM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Tổng lượt tham gia - Sky Blue (Trust & Engagement) */}
          <div className="group bg-gradient-to-br from-sky-500 via-sky-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-colors">
                <MessageSquareText className="w-7 h-7" />
              </div>
              <div className="text-right">
                <span className="text-5xl font-bold tracking-tight">
                  {statistics?.totalResponses || 0}
                </span>
              </div>
            </div>
            <p className="text-sky-50 text-sm font-semibold tracking-wide uppercase">
              Lượt tham gia
            </p>
            <p className="text-sky-100/80 text-xs mt-1">
              Khách hàng đã trả lời
            </p>
          </div>

          {/* Card 2: Tổng khách hàng - Violet (Authority & Database) */}
          <div className="group bg-gradient-to-br from-violet-500 via-violet-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-colors">
                <Users className="w-7 h-7" />
              </div>
              <div className="text-right">
                <span className="text-5xl font-bold tracking-tight">
                  {totalCustomers}
                </span>
              </div>
            </div>
            <p className="text-violet-50 text-sm font-semibold tracking-wide uppercase">
              Tổng khách hàng
            </p>
            <p className="text-violet-100/80 text-xs mt-1">Trong hệ thống</p>
          </div>

          {/* Card 3: Tỷ lệ hoàn thành - Emerald (Success & Growth) */}
          <div className="group bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-colors">
                <Target className="w-7 h-7" />
              </div>
              <div className="text-right">
                <span className="text-5xl font-bold tracking-tight">
                  {completionRate}
                </span>
                <span className="text-3xl font-semibold">%</span>
              </div>
            </div>
            <p className="text-emerald-50 text-sm font-semibold tracking-wide uppercase">
              Tỷ lệ hoàn thành
            </p>
            <p className="text-emerald-100/80 text-xs mt-1">
              {statistics?.totalResponses || 0}/{totalCustomers} đã tham gia
            </p>
          </div>
        </div>

        {/* Tabs - Modern Design */}
        <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm">
          <div className="flex border-b-2 border-slate-200 bg-slate-50">
            <button
              onClick={() => setActiveTab("statistics")}
              className={`flex-1 px-6 py-4 font-bold transition-all relative ${
                activeTab === "statistics"
                  ? "text-sky-600 bg-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Thống kê & Biểu đồ
              </div>
              {activeTab === "statistics" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("responses");
                if (responses.length === 0 && statistics?.totalResponses > 0) {
                  loadResponses(1);
                }
              }}
              className={`flex-1 px-6 py-4 font-bold transition-all relative ${
                activeTab === "responses"
                  ? "text-sky-600 bg-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Phản hồi chi tiết ({statistics?.totalResponses || 0})
              </div>
              {activeTab === "responses" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500 rounded-t-full" />
              )}
            </button>
          </div>

          <div className="p-6">
            {activeTab === "statistics" ? (
              <div className="space-y-8">
                {statistics?.questionStats?.length > 0 ? (
                  statistics.questionStats.map((stat: any, index: number) => (
                    <div
                      key={stat.questionId}
                      className="border-2 border-slate-200 rounded-2xl p-6 bg-gradient-to-br from-white to-slate-50/50 hover:border-sky-300 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start gap-3 mb-6">
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white font-bold text-base shadow-md flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-lg mb-1">
                            {stat.questionText}
                          </h4>
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                stat.type === "single_choice"
                                  ? "bg-violet-100 text-violet-700"
                                  : "bg-sky-100 text-sky-700"
                              }`}
                            >
                              {stat.type === "single_choice"
                                ? "Trắc nghiệm"
                                : "Tự luận"}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-semibold text-slate-700">
                              {stat.totalAnswers}
                            </span>{" "}
                            câu trả lời
                          </p>
                        </div>
                      </div>

                      {stat.type === "single_choice" && stat.optionStats ? (
                        <div className="space-y-6">
                          {/* Recharts Bar Chart */}
                          <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm">
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart
                                data={stat.optionStats.map(
                                  (opt: any, idx: number) => ({
                                    name:
                                      opt.option.length > 20
                                        ? opt.option.substring(0, 20) + "..."
                                        : opt.option,
                                    fullName: opt.option,
                                    value: opt.count,
                                    percentage: parseFloat(opt.percentage),
                                  }),
                                )}
                                margin={{
                                  top: 20,
                                  right: 30,
                                  left: 20,
                                  bottom: 60,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#E2E8F0"
                                />
                                <XAxis
                                  dataKey="name"
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  tick={{ fontSize: 12, fill: "#64748B" }}
                                />
                                <YAxis tick={{ fill: "#64748B" }} />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-sky-200">
                                          <p className="font-bold text-slate-900 mb-2 text-base">
                                            {data.fullName}
                                          </p>
                                          <p className="text-sm text-slate-600 flex items-center gap-2">
                                            <span className="font-medium">
                                              Số lượng:
                                            </span>
                                            <span className="font-bold text-sky-600 text-lg">
                                              {data.value}
                                            </span>
                                          </p>
                                          <p className="text-sm text-slate-600 flex items-center gap-2">
                                            <span className="font-medium">
                                              Tỷ lệ:
                                            </span>
                                            <span className="font-bold text-emerald-600 text-lg">
                                              {data.percentage}%
                                            </span>
                                          </p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                  {stat.optionStats.map(
                                    (_: any, idx: number) => (
                                      <Cell
                                        key={`cell-${idx}`}
                                        fill={COLORS[idx % COLORS.length]}
                                      />
                                    ),
                                  )}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Detailed List */}
                          <div className="space-y-4">
                            {stat.optionStats.map(
                              (option: any, oIndex: number) => (
                                <div
                                  key={oIndex}
                                  className="bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-sky-300 transition-all"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
                                      <span
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-md"
                                        style={{
                                          backgroundColor:
                                            COLORS[oIndex % COLORS.length],
                                        }}
                                      >
                                        {String.fromCharCode(65 + oIndex)}
                                      </span>
                                      {option.option}
                                    </span>
                                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                      <span className="text-sky-600 text-lg">
                                        {option.count}
                                      </span>
                                      <span className="text-slate-400 font-medium">
                                        ({option.percentage}%)
                                      </span>
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden shadow-inner">
                                    <div
                                      className="h-3.5 rounded-full transition-all duration-700 shadow-sm relative overflow-hidden"
                                      style={{
                                        width: `${option.percentage}%`,
                                        background: `linear-gradient(90deg, ${COLORS[oIndex % COLORS.length]}, ${COLORS[oIndex % COLORS.length]}dd)`,
                                      }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 bg-white rounded-xl p-5 border-2 border-slate-200">
                          <p className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <MessageSquareText className="w-5 h-5 text-sky-600" />
                            Các câu trả lời tự luận:
                          </p>
                          <div className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar">
                            {stat.textAnswers
                              ?.slice(0, 50)
                              .map((answer: string, aIndex: number) => (
                                <div
                                  key={aIndex}
                                  className="p-4 bg-gradient-to-r from-slate-50 to-sky-50/30 border-l-4 border-sky-500 rounded-lg text-sm text-slate-700 hover:shadow-md transition-shadow"
                                >
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-sky-500 text-white text-xs font-bold mr-3">
                                    {aIndex + 1}
                                  </span>
                                  "{answer}"
                                </div>
                              ))}
                          </div>
                          {stat.textAnswers?.length > 50 && (
                            <p className="text-sm text-slate-500 italic pt-3 border-t-2 border-slate-200 font-medium">
                              ... và {stat.textAnswers.length - 50} câu trả lời
                              khác (xem trong file xuất báo cáo)
                            </p>
                          )}
                          {stat.totalAnswers === 0 && (
                            <p className="text-sm text-slate-400 italic text-center py-8">
                              Chưa có câu trả lời nào
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg font-medium">
                      Chưa có dữ liệu thống kê
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                      Dữ liệu sẽ hiển thị khi có khách hàng tham gia khảo sát
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {responses.length > 0 ? (
                  responses.map((response) => (
                    <div
                      key={response._id}
                      className="border-2 border-slate-200 rounded-xl p-5 bg-white hover:border-blue-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
                            {response.customerId?.userId?.displayName?.[0] ||
                              "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {response.customerId?.userId?.displayName ||
                                "Khách hàng"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(response.createdAt).toLocaleString(
                                "vi-VN",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {response.answers.map((answer: any, aIndex: number) => {
                          const question = currentSurvey.questions.find(
                            (q: any) => q._id === answer.questionId,
                          );
                          return (
                            <div key={aIndex} className="text-sm">
                              <p className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <span className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                                  {aIndex + 1}
                                </span>
                                {question?.questionText ||
                                  "Câu hỏi không tồn tại"}
                              </p>
                              <p className="text-slate-600 pl-8 py-2 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                {answer.selectedOption ||
                                  answer.textAnswer ||
                                  "Chưa trả lời"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg font-medium">
                      Chưa có phản hồi nào
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                      Phản hồi từ khách hàng sẽ hiển thị tại đây
                    </p>
                  </div>
                )}

                {/* Responses Pagination */}
                {responsesTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                      onClick={() => loadResponses(responsesPage - 1)}
                      disabled={responsesPage === 1 || loading}
                      className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Trước
                    </button>
                    <span className="text-sm text-slate-600 font-medium">
                      Trang {responsesPage} / {responsesTotalPages}
                    </span>
                    <button
                      onClick={() => loadResponses(responsesPage + 1)}
                      disabled={
                        responsesPage === responsesTotalPages || loading
                      }
                      className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyDetail;

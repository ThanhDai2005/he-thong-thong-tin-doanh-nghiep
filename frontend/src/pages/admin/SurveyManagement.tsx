import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  Search,
  Plus,
  BarChart3,
  PauseCircle,
  PlayCircle,
  MessageSquareText,
  Pencil,
} from "lucide-react";
import { useAdminSurveyStore } from "@/stores/useAdminSurveyStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { toast } from "sonner";
import { confirmDelete, confirmRestore } from "@/lib/sweetalert";
import { hasPermission } from "@/lib/permissions";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const SurveyManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("keyword") || "";
  const statusFilter = searchParams.get("status") || "all";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const [localKeyword, setLocalKeyword] = useState(searchTerm);

  const { user } = useAdminAuthStore();
  const { surveys, totalPages, loading, fetchSurveys, changeStatus } =
    useAdminSurveyStore();

  const showSkeleton = loading && surveys.length === 0;
  const showOverlay = loading && surveys.length > 0;

  const canView = hasPermission(user, "surveys_view");
  const canCreate = hasPermission(user, "surveys_create");
  const canEdit = hasPermission(user, "surveys_edit");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localKeyword]);

  const refetchSurveys = async () => {
    const status = statusFilter !== "all" ? statusFilter : "";
    await fetchSurveys(searchTerm, status, currentPage, limit);
  };

  useEffect(() => {
    if (canView) {
      refetchSurveys();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit, searchTerm, statusFilter, fetchSurveys, canView]);

  const handleChangeStatus = async (
    surveyId: string,
    status: "active" | "inactive",
  ) => {
    if (!canEdit) {
      toast.error("Bạn không có quyền chỉnh sửa khảo sát");
      return;
    }

    const result =
      status === "active"
        ? await confirmRestore(
            "Kích hoạt khảo sát?",
            "Khảo sát sẽ hiển thị cho khách hàng",
          )
        : await confirmDelete(
            "Vô hiệu hóa khảo sát?",
            "Khảo sát sẽ không hiển thị cho khách hàng",
          );

    if (!result.isConfirmed) return;

    try {
      await changeStatus(surveyId, status);
      await refetchSurveys();
    } catch {
      // Error handled in store
    }
  };

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý khảo sát", isCurrentPage: true },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      {/* HEADER BREADCRUMB */}
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý khảo sát", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* TITLE & FILTERS */}
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 mb-6 tracking-tight">
            Quản lý khảo sát
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
                  placeholder="Tìm kiếm theo tiêu đề, mô tả..."
                  value={localKeyword}
                  onChange={(e) => setLocalKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white transition-shadow"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => updateURL({ status: e.target.value, page: "1" })}
                className="w-full sm:w-48 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã đóng</option>
              </select>
            </div>

            {/* Right: Actions */}
            {canCreate && (
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                <button
                  onClick={() => navigate("/admin/survey/create")}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#b51c00] text-white rounded-[20px] font-semibold text-sm hover:bg-[#8e1400] shadow-sm shadow-red-500/20 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Tạo khảo sát mới
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DATA TABLE SECTION */}
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[18px] font-bold text-gray-900">Danh sách</h2>
          </div>

          <div className="relative">
            {showOverlay && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-lg shadow-lg border border-gray-200">
                  <div className="w-5 h-5 border-2 border-[#b51c00] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600 font-medium">
                    Đang tải...
                  </span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[12px] text-gray-500 bg-[#f1f5f9] uppercase font-bold border-b border-gray-200 tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">
                      STT
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Tiêu đề
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Người tạo
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Phản hồi
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Ngày tạo
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {showSkeleton ? (
                    // Skeleton rows on first load
                    Array.from({ length: limit }).map((_, index) => (
                      <tr
                        key={index}
                        className="animate-pulse bg-white border-b border-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-8"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-48"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-6 bg-gray-200 rounded-md w-24 mx-auto"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            <div className="h-7 bg-gray-200 rounded w-16"></div>
                            <div className="h-7 bg-gray-200 rounded w-16"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : surveys.length > 0 ? (
                    surveys.map((survey, index) => (
                      <tr
                        key={survey._id}
                        className="bg-white border-b border-gray-50 hover:bg-[#f8fafc] transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {(currentPage - 1) * limit + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {survey.title}
                          </div>
                          {survey.description && (
                            <div className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                              {survey.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-600">
                            {survey.createdBy?.userId?.displayName || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-sm font-medium">
                            <MessageSquareText className="w-3.5 h-3.5" />
                            {survey.responseCount || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {survey.status === "active" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#d1fae5] text-[#15803d]">
                              <PlayCircle className="w-3.5 h-3.5" />
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#fee2e2] text-[#b91c1c]">
                              <PauseCircle className="w-3.5 h-3.5" />
                              Đã đóng
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-600">
                            {new Date(survey.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            {canEdit && survey.responseCount === 0 && (
                              <button
                                onClick={() =>
                                  navigate(`/admin/survey/edit/${survey._id}`)
                                }
                                className="px-3 py-1.5 border border-[#22c55e] text-[#16a34a] rounded-[6px] text-xs font-bold hover:bg-[#f0fdf4] transition-colors flex items-center gap-1"
                              >
                                <Pencil className="w-3 h-3" />
                                Sửa
                              </button>
                            )}
                            <button
                              onClick={() =>
                                navigate(`/admin/survey/${survey._id}`)
                              }
                              className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-[6px] text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-1"
                            >
                              <BarChart3 className="w-3 h-3" />
                              Thống kê
                            </button>
                            {canEdit && (
                              <button
                                onClick={() =>
                                  handleChangeStatus(
                                    survey._id,
                                    survey.status === "active"
                                      ? "inactive"
                                      : "active",
                                  )
                                }
                                className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors flex items-center gap-1 ${
                                  survey.status === "active"
                                    ? "border border-[#ef4444] text-[#dc2626] hover:bg-[#fef2f2]"
                                    : "border border-[#22c55e] text-[#16a34a] hover:bg-[#f0fdf4]"
                                }`}
                              >
                                {survey.status === "active" ? (
                                  <>
                                    <PauseCircle className="w-3 h-3" />
                                    Đóng
                                  </>
                                ) : (
                                  <>
                                    <PlayCircle className="w-3 h-3" />
                                    Mở
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <MessageSquareText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                          Không tìm thấy khảo sát nào
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages >= 1 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => updateURL({ page: page.toString() })}
            limit={limit}
            onLimitChange={(newLimit) =>
              updateURL({ limit: newLimit.toString(), page: "1" })
            }
          />
        )}
      </div>
    </div>
  );
};

export default SurveyManagement;

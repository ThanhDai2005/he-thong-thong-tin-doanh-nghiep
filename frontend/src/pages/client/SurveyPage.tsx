import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MessageSquareText, ChevronRight, Calendar } from "lucide-react";
import { useSurveyStore } from "@/stores/useSurveyStore";

const SurveyPage = () => {
  const navigate = useNavigate();
  const { surveys, totalPages, loading, fetchSurveys } = useSurveyStore();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchSurveys(currentPage, 10);
  }, [currentPage, fetchSurveys]);

  return (
    <>
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Khảo sát khách hàng
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Chia sẻ ý kiến của bạn để giúp chúng tôi cải thiện dịch vụ tốt hơn
            </p>
          </div>

          {/* Surveys Grid */}
          {loading && surveys.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
                >
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-5/6 mb-4" />
                  <div className="h-10 bg-slate-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : surveys.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {surveys.map((survey) => (
                  <div
                    key={survey._id}
                    className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => navigate(`/surveys/${survey._id}`)}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <MessageSquareText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {survey.title}
                        </h3>
                        {survey.description && (
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {survey.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(survey.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                      <button className="flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                        Tham gia
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-slate-600">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages || loading}
                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <MessageSquareText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">
                Hiện chưa có khảo sát nào
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SurveyPage;

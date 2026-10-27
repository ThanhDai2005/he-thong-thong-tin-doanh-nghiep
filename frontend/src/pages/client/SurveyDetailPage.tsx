import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  MessageSquareText,
} from "lucide-react";
import { useSurveyStore } from "@/stores/useSurveyStore";
import { toast } from "sonner";

const SurveyDetailPage = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const {
    currentSurvey,
    loading,
    getSurveyDetail,
    submitSurvey,
    clearCurrentSurvey,
  } = useSurveyStore();

  const [answers, setAnswers] = useState<
    Array<{
      questionId: string;
      selectedOption?: string;
      textAnswer?: string;
    }>
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Đổi surveyId: reset toàn bộ state local + clear store ──
  useEffect(() => {
    setSubmitted(false);
    setAnswers([]);
    setSubmitting(false);
    clearCurrentSurvey();

    if (surveyId) {
      getSurveyDetail(surveyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId]);

  // ── Khi có survey mới: sync hasResponded + init answers ──
  useEffect(() => {
    if (!currentSurvey || currentSurvey._id !== surveyId) return;

    // Đã trả lời trước đó → hiện màn cảm ơn
    setSubmitted(!!currentSurvey.hasResponded);

    setAnswers(
      (currentSurvey.questions || []).map((q: { _id: string }) => ({
        questionId: q._id,
        selectedOption: "",
        textAnswer: "",
      })),
    );
  }, [currentSurvey, surveyId]);

  const handleAnswerChange = (
    questionId: string,
    type: "single_choice" | "text",
    value: string,
  ) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionId === questionId
          ? {
              questionId,
              ...(type === "single_choice"
                ? { selectedOption: value, textAnswer: "" }
                : { textAnswer: value, selectedOption: "" }),
            }
          : a,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSurvey?.questions?.length) return;

    for (let i = 0; i < currentSurvey.questions.length; i++) {
      const question = currentSurvey.questions[i];
      const answer = answers.find((a) => a.questionId === question._id);

      if (!answer) {
        toast.error(`Vui lòng trả lời câu hỏi ${i + 1}`);
        return;
      }
      if (question.type === "single_choice" && !answer.selectedOption) {
        toast.error(`Vui lòng chọn đáp án cho câu hỏi ${i + 1}`);
        return;
      }
      if (question.type === "text" && !answer.textAnswer?.trim()) {
        toast.error(`Vui lòng trả lời câu hỏi ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await submitSurvey(surveyId!, answers);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // toast đã có trong store
    } finally {
      setSubmitting(false);
    }
  };

  // Loading hoặc đang đổi survey (chưa có data khớp id)
  if (loading || !currentSurvey || currentSurvey._id !== surveyId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Đã gửi (lần này hoặc lần trước)
  if (submitted || currentSurvey.hasResponded) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Cảm ơn bạn đã tham gia!
            </h2>
            <p className="text-slate-600 mb-8">
              Phản hồi của bạn đã được ghi nhận và sẽ giúp chúng tôi cải thiện
              dịch vụ tốt hơn.
            </p>
            <button
              onClick={() => navigate("/surveys")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Quay lại danh sách khảo sát
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form làm khảo sát
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/surveys")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <MessageSquareText className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-3">
                {currentSurvey.title}
              </h1>
              {currentSurvey.description && (
                <p className="text-slate-600 leading-relaxed">
                  {currentSurvey.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentSurvey.questions.map((question: any, index: number) => {
            const answer = answers.find((a) => a.questionId === question._id);

            return (
              <div
                key={question._id}
                className="bg-white rounded-xl border border-slate-200 p-6"
              >
                <div className="flex items-start gap-4 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {question.questionText}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {question.type === "single_choice"
                        ? "Chọn một đáp án"
                        : "Nhập câu trả lời của bạn"}
                    </p>
                  </div>
                </div>

                {question.type === "single_choice" ? (
                  <div className="space-y-3 ml-12">
                    {(question.options || []).map(
                      (option: string, oIndex: number) => (
                        <label
                          key={oIndex}
                          className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group"
                        >
                          <input
                            type="radio"
                            name={`question-${question._id}`}
                            value={option}
                            checked={answer?.selectedOption === option}
                            onChange={(e) =>
                              handleAnswerChange(
                                question._id,
                                "single_choice",
                                e.target.value,
                              )
                            }
                            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                          />
                          <span className="text-slate-700 group-hover:text-slate-900 font-medium">
                            {option}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="ml-12">
                    <textarea
                      value={answer?.textAnswer || ""}
                      onChange={(e) =>
                        handleAnswerChange(question._id, "text", e.target.value)
                      }
                      rows={4}
                      placeholder="Nhập câu trả lời của bạn..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                      maxLength={1000}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi khảo sát"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyDetailPage;

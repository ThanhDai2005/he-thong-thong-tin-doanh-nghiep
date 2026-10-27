import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, X, Loader2, Save, Trash2 } from "lucide-react";
import { useAdminSurveyStore } from "@/stores/useAdminSurveyStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

interface Question {
  questionText: string;
  type: "single_choice" | "text";
  options: string[];
}

const SurveyCreate = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuthStore();
  const { createSurvey, loading } = useAdminSurveyStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: "",
      type: "single_choice",
      options: ["", ""],
    },
  ]);

  const canCreate = hasPermission(user, "surveys_create");

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        type: "single_choice",
        options: ["", ""],
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error("Khảo sát phải có ít nhất 1 câu hỏi");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (
    index: number,
    field: keyof Question,
    value: string,
  ) => {
    const newQuestions = [...questions];
    if (field === "type") {
      newQuestions[index][field] = value as "single_choice" | "text";
      if (value === "text") {
        newQuestions[index].options = [];
      } else {
        newQuestions[index].options = ["", ""];
      }
    } else {
      newQuestions[index][field] = value as never;
    }
    setQuestions(newQuestions);
  };

  const handleAddOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push("");
    setQuestions(newQuestions);
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length <= 2) {
      toast.error("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn");
      return;
    }
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(newQuestions);
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề khảo sát");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Vui lòng nhập nội dung câu hỏi ${i + 1}`);
        return;
      }

      if (q.type === "single_choice") {
        const validOptions = q.options.filter((opt) => opt.trim());
        if (validOptions.length < 2) {
          toast.error(`Câu hỏi ${i + 1} phải có ít nhất 2 lựa chọn hợp lệ`);
          return;
        }
      }
    }

    try {
      await createSurvey({
        title: title.trim(),
        description: description.trim(),
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          type: q.type,
          options:
            q.type === "single_choice"
              ? q.options.filter((opt) => opt.trim()).map((opt) => opt.trim())
              : undefined,
        })),
        status,
      });

      navigate("/admin/surveys");
    } catch {
      // Error handled in store
    }
  };

  if (!canCreate) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Quản lý khảo sát", href: "/admin/surveys" },
          { label: "Tạo khảo sát", isCurrentPage: true },
        ]}
      />
    );
  }

  const breadcrumbItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Quản lý khảo sát", href: "/admin/surveys" },
    { label: "Tạo khảo sát mới", isCurrentPage: true },
  ];

  return (
    <>
      <AdminHeader items={breadcrumbItems} />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <AdminPageHeading
              title="Tạo khảo sát mới"
              subtitle="Tạo khảo sát để thu thập ý kiến và phản hồi từ khách hàng"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  1
                </div>
                Thông tin cơ bản
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tiêu đề khảo sát <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Khảo sát mức độ hài lòng về dịch vụ"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    maxLength={200}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {title.length}/200 ký tự
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn gọn về mục đích của khảo sát..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {description.length}/500 ký tự
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as "active" | "inactive")
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer bg-white"
                  >
                    <option value="active">Hoạt động (hiển thị ngay)</option>
                    <option value="inactive">Đã đóng (ẩn khảo sát)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Questions Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  Câu hỏi khảo sát <span className="text-red-500">*</span>
                </h3>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Thêm câu hỏi
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((question, qIndex) => (
                  <div
                    key={qIndex}
                    className="border-2 border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/50 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        {/* Question Number & Text */}
                        <div className="flex items-start gap-3">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm flex-shrink-0 mt-1">
                            {qIndex + 1}
                          </span>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={question.questionText}
                              onChange={(e) =>
                                handleQuestionChange(
                                  qIndex,
                                  "questionText",
                                  e.target.value,
                                )
                              }
                              placeholder="Nhập câu hỏi của bạn..."
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white font-medium"
                              maxLength={300}
                            />
                            <p className="text-xs text-slate-500 mt-1 ml-1">
                              {question.questionText.length}/300 ký tự
                            </p>
                          </div>
                        </div>

                        {/* Question Type */}
                        <div className="ml-10">
                          <label className="block text-xs font-medium text-slate-600 mb-2">
                            Loại câu hỏi
                          </label>
                          <select
                            value={question.type}
                            onChange={(e) =>
                              handleQuestionChange(
                                qIndex,
                                "type",
                                e.target.value,
                              )
                            }
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-sm bg-white font-medium"
                          >
                            <option value="single_choice">
                              Trắc nghiệm (chọn 1 đáp án)
                            </option>
                            <option value="text">Tự luận (nhập văn bản)</option>
                          </select>
                        </div>

                        {/* Options for Multiple Choice */}
                        {question.type === "single_choice" && (
                          <div className="ml-10 space-y-3">
                            <label className="block text-xs font-medium text-slate-600">
                              Các lựa chọn (tối thiểu 2)
                            </label>
                            {question.options.map((option, oIndex) => (
                              <div
                                key={oIndex}
                                className="flex items-center gap-2"
                              >
                                <span className="text-sm text-slate-500 font-medium w-8">
                                  {String.fromCharCode(65 + oIndex)}.
                                </span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      qIndex,
                                      oIndex,
                                      e.target.value,
                                    )
                                  }
                                  placeholder={`Lựa chọn ${String.fromCharCode(65 + oIndex)}`}
                                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
                                  maxLength={200}
                                />
                                {question.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveOption(qIndex, oIndex)
                                    }
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Xóa lựa chọn"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddOption(qIndex)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium ml-10"
                            >
                              + Thêm lựa chọn
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Delete Question Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nút Thêm câu hỏi ở cuối list — luôn hiển thị */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border-2 border-dashed border-blue-200 hover:border-blue-400 transition-all font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Thêm câu hỏi
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 justify-end bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <button
                type="button"
                onClick={() => navigate("/admin/surveys")}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Tạo khảo sát
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SurveyCreate;

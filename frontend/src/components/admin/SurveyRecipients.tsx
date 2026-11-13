import { useState, useEffect } from "react";
import {
  Search,
  Send,
  Users,
  CheckSquare,
  Square,
  Loader2,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { useAdminSurveyStore } from "@/stores/useAdminSurveyStore";
import type { Survey } from "@/types/survey";
import { toast } from "sonner";
import AdminPagination from "@/components/admin/AdminPagination";

interface SurveyRecipientsProps {
  survey: Survey;
  onSent?: () => void;
}

const SurveyRecipients = ({ survey, onSent }: SurveyRecipientsProps) => {
  const {
    recipients,
    recipientsTotalPages,
    recipientsLoading,
    sending,
    fetchRecipients,
    sendSurvey,
  } = useAdminSurveyStore();

  const [keyword, setKeyword] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (showPanel) {
      const timer = setTimeout(() => {
        fetchRecipients(keyword, currentPage, limit);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [keyword, currentPage, limit, showPanel, fetchRecipients]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setCurrentPage(1);
  };

  const handleToggleSelect = (customerId: string) => {
    if (selectedIds.includes(customerId)) {
      setSelectedIds(selectedIds.filter((id) => id !== customerId));
    } else {
      setSelectedIds([...selectedIds, customerId]);
    }
  };

  const selectableRecipients = recipients.filter(
    (recipient) => !survey.recipientIds?.includes(recipient._id),
  );
  const isAllSelected =
    selectableRecipients.length > 0 &&
    selectableRecipients.every((recipient) => selectedIds.includes(recipient._id));

  const handleSelectAll = () => {
    const pageIds = selectableRecipients.map((recipient) => recipient._id);
    if (isAllSelected) {
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds([
        ...selectedIds,
        ...pageIds.filter((id) => !selectedIds.includes(id)),
      ]);
    }
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 khách hàng");
      return;
    }

    if (survey.status !== "active") {
      toast.error("Vui lòng kích hoạt khảo sát trước khi gửi");
      return;
    }

    try {
      await sendSurvey(survey._id, selectedIds);
      setSelectedIds([]);
      setKeyword("");
      setCurrentPage(1);
      setShowPanel(false);
      onSent?.();
    } catch {
      // Error handled in store
    }
  };

  const alreadySentCount = survey.recipientCount || 0;

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-5 border-b-2 border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Gửi khảo sát đến khách hàng
              </h3>
              <p className="text-sm text-slate-600">
                Chọn khách hàng cụ thể để nhận khảo sát này
              </p>
            </div>
          </div>
          {!showPanel && (
            <button
              onClick={() => setShowPanel(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              <UserCheck className="w-5 h-5" />
              Chọn người nhận
            </button>
          )}
        </div>

        {/* Already Sent Info */}
        {alreadySentCount > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm bg-white/60 backdrop-blur-sm px-4 py-3 rounded-lg border border-sky-200">
            <AlertCircle className="w-5 h-5 text-sky-600 flex-shrink-0" />
            <span className="text-slate-700">
              Đã gửi đến{" "}
              <span className="font-bold text-sky-700">{alreadySentCount}</span>{" "}
              khách hàng. Bạn có thể tiếp tục gửi cho khách hàng khác.
            </span>
          </div>
        )}
      </div>

      {/* Selection Panel */}
      {showPanel && (
        <div className="p-6">
          {/* Search Bar */}
          <div className="mb-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={keyword}
                disabled={sending}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Tìm theo tên, email, số điện thoại..."
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Selection Actions */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-slate-200">
            <button
              disabled={recipientsLoading || selectableRecipients.length === 0 || sending}
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-5 h-5" />
                  Bỏ chọn trang này
                </>
              ) : (
                <>
                  <Square className="w-5 h-5" />
                  Chọn tất cả trang này
                </>
              )}
            </button>
            <span className="text-sm font-bold text-slate-700">
              Đã chọn:{" "}
              <span className="text-sky-600 text-lg">{selectedIds.length}</span>
            </span>
          </div>

          {/* Recipients List */}
          {recipientsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
          ) : recipients.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto overscroll-contain custom-scrollbar pr-1">
              {recipients.map((recipient) => {
                const isSelected = selectedIds.includes(recipient._id);
                const isAlreadySent = survey.recipientIds?.includes(
                  recipient._id,
                );

                return (
                  <div
                    key={recipient._id}
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-disabled={Boolean(isAlreadySent) || sending}
                    tabIndex={isAlreadySent || sending ? -1 : 0}
                    onKeyDown={(event) => {
                      if ((event.key === " " || event.key === "Enter") && !isAlreadySent && !sending) {
                        event.preventDefault();
                        handleToggleSelect(recipient._id);
                      }
                    }}
                    onClick={() =>
                      !isAlreadySent && !sending && handleToggleSelect(recipient._id)
                    }
                    className={`group flex items-center gap-4 p-4 border-2 rounded-xl transition-all cursor-pointer ${
                      isAlreadySent
                        ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                        : isSelected
                          ? "bg-sky-50 border-sky-500 shadow-md"
                          : "border-slate-200 hover:border-sky-300 hover:bg-sky-50/50"
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      {isAlreadySent ? (
                        <div className="w-6 h-6 rounded-md bg-slate-300 flex items-center justify-center">
                          <CheckSquare className="w-5 h-5 text-white" />
                        </div>
                      ) : isSelected ? (
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
                          <CheckSquare className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <Square className="w-6 h-6 text-slate-400 group-hover:text-sky-500 transition-colors" />
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                            <span>{recipient.userId?.displayName?.trim()[0]?.toUpperCase() || "?"}</span>
                            {recipient.userId?.avatarUrl && (
                              <img
                                key={recipient.userId?.avatarUrl}
                                src={recipient.userId?.avatarUrl}
                                alt={recipient.userId?.displayName || "Khách hàng"}
                                className="absolute inset-0 size-full object-cover bg-slate-100"
                                onError={(event) => { event.currentTarget.style.display = "none"; }}
                              />
                            )}
                          </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 truncate">
                          {recipient.userId?.displayName || "Không rõ"}
                        </h4>
                        {isAlreadySent && (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs font-semibold">
                            Đã gửi
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-slate-600">
                        <span className="truncate">
                          {recipient.userId?.email || "N/A"}
                        </span>
                        {recipient.userId?.phone && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span>{recipient.userId.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                {keyword
                  ? "Không tìm thấy khách hàng"
                  : "Chưa có khách hàng nào"}
              </p>
            </div>
          )}

          {recipientsTotalPages > 0 && (
            <fieldset disabled={recipientsLoading || sending}>
              <AdminPagination
                currentPage={currentPage}
                totalPages={recipientsTotalPages}
                limit={limit}
                onPageChange={setCurrentPage}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setCurrentPage(1);
                }}
              />
            </fieldset>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t-2 border-slate-200">
            <button
              onClick={() => {
                setShowPanel(false);
                setSelectedIds([]);
                setKeyword("");
                setCurrentPage(1);
              }}
              disabled={sending}
              className="px-5 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              onClick={handleSend}
              disabled={
                sending || selectedIds.length === 0 || survey.status !== "active"
              }
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Gửi đến {selectedIds.length} khách hàng
                </>
              )}
            </button>
          </div>

          {survey.status !== "active" && (
            <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-3 rounded-lg border-2 border-amber-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                Khảo sát đang đóng. Vui lòng kích hoạt khảo sát trước khi gửi.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SurveyRecipients;

import { Loader2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminFormActionsProps {
  loading: boolean;
  submitLabel?: string;
}

const AdminFormActions = ({
  loading,
  submitLabel = "Lưu",
}: AdminFormActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
        disabled={loading}
      >
        Hủy
      </button>
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 bg-[#b51c00] text-white rounded-lg font-semibold text-sm hover:bg-[#8e1400] shadow-sm shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang lưu...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            {submitLabel}
          </>
        )}
      </button>
    </div>
  );
};

export default AdminFormActions;

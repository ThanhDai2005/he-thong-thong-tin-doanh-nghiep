import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminPageHeadingProps {
  title: string;
  subtitle?: string;
}

const AdminPageHeading = ({ title, subtitle }: AdminPageHeadingProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => navigate(-1)}
        className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div>
        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default AdminPageHeading;

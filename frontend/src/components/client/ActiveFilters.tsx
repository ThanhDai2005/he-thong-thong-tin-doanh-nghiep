import { X } from "lucide-react";

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface ActiveFiltersProps {
  filters: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

const ActiveFilters = ({ filters, onRemove, onClearAll }: ActiveFiltersProps) => {
  if (filters.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-700">
          Đang lọc ({filters.length})
        </span>
        <button
          onClick={onClearAll}
          className="text-xs text-[#b51c00] hover:text-[#8e1400] font-medium transition-colors"
        >
          Xóa tất cả
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onRemove(filter.key)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#b51c00] rounded-full text-sm font-medium hover:bg-red-100 transition-colors group"
          >
            <span>{filter.label}</span>
            <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActiveFilters;

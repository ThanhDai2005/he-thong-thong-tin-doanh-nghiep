interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  // Generate page numbers with ellipsis logic
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];

    // 1. Nếu tổng số trang ít (từ 6 trở xuống), hiển thị tất cả, không cần dấu ...
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 2. Nếu nhiều trang thì bắt đầu tính toán hiển thị dấu ...
      if (currentPage <= 3) {
        // Đang ở đoạn đầu: Hiện 1 2 3 4 ... Trang cuối
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Đang ở đoạn cuối: Hiện 1 ... (Cuối-3) (Cuối-2) (Cuối-1) Cuối
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        // Đang ở giữa: Hiện 1 ... (Trước) (Hiện tại) (Sau) ... Cuối
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }

    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#b51c00] hover:text-[#b51c00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600"
        aria-label="Trang trước"
      >
        <span className="material-symbols-outlined text-[20px]">
          chevron_left
        </span>
      </button>

      {/* Page Numbers with Ellipsis Logic */}
      {pages.map((page, index) =>
        page === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="w-10 h-10 flex items-center justify-center text-gray-400 font-medium tracking-widest"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-lg font-semibold transition-all ${
              currentPage === page
                ? "bg-[#b51c00] text-white shadow-md shadow-red-100"
                : "border border-gray-300 text-gray-700 hover:border-[#b51c00] hover:text-[#b51c00]"
            }`}
          >
            {page}
          </button>
        ),
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#b51c00] hover:text-[#b51c00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600"
        aria-label="Trang sau"
      >
        <span className="material-symbols-outlined text-[20px]">
          chevron_right
        </span>
      </button>
    </div>
  );
};

export default Pagination;

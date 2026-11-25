import api from "@/lib/adminAxios";
import type { AdminStatisticState } from "@/types/store";

/**
 * Helper: Trigger download file từ blob response
 */
const triggerDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const adminExportService = {
  exportProductStatistics: async (
    stats: NonNullable<AdminStatisticState["productStats"]>,
  ) => {
    const response = await api.post(
      "/admin/export/dashboard/product-statistics",
      { data: stats.products, mode: stats.mode, year: stats.year },
      { responseType: "blob" },
    );
    const modeLabel =
      stats.mode === "month"
        ? "Thang"
        : stats.mode === "quarter"
          ? "Quy"
          : "Nam";
    triggerDownload(
      new Blob([response.data]),
      `Thong_Ke_San_Pham_Theo_${modeLabel}_${stats.year}.xlsx`,
    );
  },

  /**
   * Xuất thống kê Thu/Chi/Lợi nhuận theo Tháng/Quý/Năm (Dashboard - bảng phần b)
   */
  exportDashboardRevenueByPeriod: async (
    data: any[],
    mode: "month" | "quarter" | "year",
    year?: number,
  ) => {
    const response = await api.post(
      "/admin/export/dashboard/revenue-by-period",
      { data, mode, year },
      { responseType: "blob" },
    );

    const modeLabel =
      mode === "month" ? "Thang" : mode === "quarter" ? "Quy" : "Nam";
    triggerDownload(
      new Blob([response.data]),
      `Thong_Ke_Theo_${modeLabel}_${year || new Date().getFullYear()}_${Date.now()}.xlsx`,
    );
  },

  /**
   * Xuất thống kê Doanh thu theo Nhân viên (Dashboard)
   */
  exportDashboardRevenueByStaff: async (data: any[]) => {
    const response = await api.post(
      "/admin/export/dashboard/revenue-by-staff",
      { data },
      { responseType: "blob" },
    );

    triggerDownload(
      new Blob([response.data]),
      `Doanh_Thu_Theo_Nhan_Vien_${Date.now()}.xlsx`,
    );
  },

  /**
   * Xuất thống kê Doanh thu theo Khách hàng (Dashboard)
   */
  exportDashboardRevenueByCustomer: async (
    data: any[],
    mode: "year" | "quarter",
    year?: number,
  ) => {
    const response = await api.post(
      "/admin/export/dashboard/revenue-by-customer",
      { data, mode, year },
      { responseType: "blob" },
    );

    const modeLabel = mode === "year" ? "Nam" : "Quy";
    triggerDownload(
      new Blob([response.data]),
      `Thong_Ke_Khach_Hang_Theo_${modeLabel}_${year || new Date().getFullYear()}_${Date.now()}.xlsx`,
    );
  },

  /**
   * Xuất thống kê Doanh thu Sản phẩm theo Quý (Dashboard)
   */
  exportDashboardRevenueByProductQuarter: async (
    data: any[],
    year?: number,
  ) => {
    const response = await api.post(
      "/admin/export/dashboard/revenue-by-product-quarter",
      { data, year },
      { responseType: "blob" },
    );

    triggerDownload(
      new Blob([response.data]),
      `Doanh_Thu_SP_Theo_Quy_${year || new Date().getFullYear()}_${Date.now()}.xlsx`,
    );
  },
};

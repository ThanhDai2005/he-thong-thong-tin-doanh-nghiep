import {
  exportRevenueByPeriod,
  exportRevenueByStaff,
  exportRevenueByProductQuarter,
  exportRevenueByCustomer,
} from "../../../../helpers/excelExport.helper.js";

// [POST] /api/v1/admin/export/dashboard/revenue-by-period
export const exportDashboardRevenueByPeriod = async (req, res) => {
  try {
    const { data, mode, year } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    if (!["month", "quarter", "year"].includes(mode)) {
      return res.status(400).json({ message: "Chế độ không hợp lệ" });
    }

    const currentYear = year || new Date().getFullYear();
    const buffer = await exportRevenueByPeriod(data, mode, currentYear);

    const modeLabel =
      mode === "month" ? "Thang" : mode === "quarter" ? "Quy" : "Nam";
    const filename = `Thong_Ke_Theo_${modeLabel}_${currentYear}_${new Date().getTime()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.log("Lỗi khi xuất Excel thống kê theo kỳ:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi xuất file Excel" });
  }
};

// [POST] /api/v1/admin/export/dashboard/revenue-by-staff
export const exportDashboardRevenueByStaff = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    const buffer = await exportRevenueByStaff(data);

    const filename = `Doanh_Thu_Theo_Nhan_Vien_${new Date().getTime()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.log("Lỗi khi xuất Excel doanh thu theo nhân viên:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi xuất file Excel" });
  }
};

// [POST] /api/v1/admin/export/dashboard/revenue-by-customer
export const exportDashboardRevenueByCustomer = async (req, res) => {
  try {
    const { data, mode, year } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    if (!["year", "quarter"].includes(mode)) {
      return res.status(400).json({ message: "Chế độ không hợp lệ" });
    }

    const currentYear = year || new Date().getFullYear();
    const buffer = await exportRevenueByCustomer(data, mode, currentYear);

    const modeLabel = mode === "year" ? "Nam" : "Quy";
    const filename = `Thong_Ke_Khach_Hang_Theo_${modeLabel}_${currentYear}_${new Date().getTime()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.log("Lỗi khi xuất Excel thống kê khách hàng:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi xuất file Excel" });
  }
};

// [POST] /api/v1/admin/export/dashboard/revenue-by-product-quarter
export const exportDashboardRevenueByProductQuarter = async (req, res) => {
  try {
    const { data, year } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    const currentYear = year || new Date().getFullYear();
    const buffer = await exportRevenueByProductQuarter(data, currentYear);

    const filename = `Doanh_Thu_SP_Theo_Quy_${currentYear}_${new Date().getTime()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.log("Lỗi khi xuất Excel doanh thu sản phẩm theo quý:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi xuất file Excel" });
  }
};

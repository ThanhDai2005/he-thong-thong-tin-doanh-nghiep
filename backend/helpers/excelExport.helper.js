import ExcelJS from "exceljs";

/**
 * Helper xuất Excel – chuẩn báo cáo quản trị / kế toán
 */

const createWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Đặc Sản Ba Miền";
  workbook.created = new Date();
  return workbook;
};

/** Header xanh navy */
const applyHeaderStyle = (row) => {
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" },
  };
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  row.border = {
    top: { style: "thin", color: { argb: "FF1E3A8A" } },
    left: { style: "thin", color: { argb: "FF1E3A8A" } },
    bottom: { style: "thin", color: { argb: "FF1E3A8A" } },
    right: { style: "thin", color: { argb: "FF1E3A8A" } },
  };
  row.height = 26;
};

/** Dòng dữ liệu xen kẽ */
const applyDataRowStyle = (row, isEven = false) => {
  row.font = { size: 11, color: { argb: "FF1F2937" } };
  row.alignment = { vertical: "middle", horizontal: "left" };
  row.border = {
    top: { style: "thin", color: { argb: "FFE5E7EB" } },
    left: { style: "thin", color: { argb: "FFE5E7EB" } },
    bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
    right: { style: "thin", color: { argb: "FFE5E7EB" } },
  };
  row.height = 22;
  if (isEven) {
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF9FAFB" },
    };
  }
};

/** Dòng TỔNG CỘNG */
const applySummaryStyle = (row) => {
  row.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF059669" },
  };
  row.alignment = { vertical: "middle", horizontal: "left" };
  row.height = 26;
  row.border = {
    top: { style: "thin", color: { argb: "FF047857" } },
    left: { style: "thin", color: { argb: "FF047857" } },
    bottom: { style: "thin", color: { argb: "FF047857" } },
    right: { style: "thin", color: { argb: "FF047857" } },
  };
};

/** Format tiền: không dùng ký tự ₫ trong numFmt để tránh ###### */
const MONEY_FMT = "#,##0";

/** Set width cột tiền đủ rộng (tránh ###### tới hàng trăm triệu) */
const setMoneyColumnWidth = (column, minWidth = 16) => {
  column.width = Math.max(column.width || 0, minWidth);
};

const finalizeColumnWidths = (worksheet, moneyKeys = []) => {
  worksheet.columns.forEach((column) => {
    const key = column.key || "";
    const isMoney = moneyKeys.includes(key);

    let maxLength = 10;
    column.eachCell({ includeEmpty: true }, (cell) => {
      let text = "";
      if (cell.value == null) text = "";
      else if (typeof cell.value === "number")
        text = cell.value.toLocaleString("vi-VN");
      else text = String(cell.value);
      maxLength = Math.max(maxLength, text.length);
    });

    if (isMoney) {
      // Số lớn + dấu phân cách: tối thiểu 16, tối đa 22
      column.width = Math.min(Math.max(maxLength + 2, 16), 22);
    } else {
      column.width = Math.min(Math.max(maxLength + 2, 12), 40);
    }
  });
};

// ─────────────────────────────────────────────
// 5b – Thu / Chi / Lợi nhuận theo kỳ
// ─────────────────────────────────────────────
export const exportRevenueByPeriod = async (data, mode, year) => {
  const workbook = createWorkbook();
  const sheetTitle =
    mode === "month"
      ? `Thống Kê Theo Tháng ${year}`
      : mode === "quarter"
        ? `Thống Kê Theo Quý ${year}`
        : "Thống Kê Theo Năm";

  const worksheet = workbook.addWorksheet(sheetTitle, {
    views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
  });

  const periods = data.map((item) =>
    mode === "month"
      ? item.month
      : mode === "quarter"
        ? item.quarter
        : String(item.year),
  );

  const moneyKeys = [...periods.map((_, i) => `period_${i}`), "total"];

  worksheet.columns = [
    { header: "Chỉ Tiêu", key: "indicator", width: 18 },
    ...periods.map((period, idx) => ({
      header: String(period),
      key: `period_${idx}`,
      width: 16,
    })),
    { header: "Tổng Cộng (đ)", key: "total", width: 18 },
  ];

  applyHeaderStyle(worksheet.getRow(1));

  const addMetricRow = (label, field, isEven) => {
    const row = worksheet.addRow({
      indicator: label,
      ...periods.reduce((acc, _, idx) => {
        acc[`period_${idx}`] = data[idx][field] || 0;
        return acc;
      }, {}),
      total: data.reduce((sum, item) => sum + (item[field] || 0), 0),
    });
    applyDataRowStyle(row, isEven);
    row.getCell("indicator").font = {
      bold: true,
      size: 11,
      color: { argb: "FF1F2937" },
    };
    moneyKeys.forEach((k) => {
      if (k === "indicator") return;
      const cell = row.getCell(k);
      cell.numFmt = MONEY_FMT;
      cell.alignment = { horizontal: "right" };
      if (field === "profit") {
        const v = cell.value || 0;
        cell.font = {
          bold: true,
          size: 11,
          color: { argb: v >= 0 ? "FF059669" : "FFDC2626" },
        };
      }
    });
    return row;
  };

  addMetricRow("Tổng Thu (HD)", "revenue", false);
  addMetricRow("Tổng Chi (PNH)", "cost", true);
  addMetricRow("Lợi Nhuận", "profit", false);

  finalizeColumnWidths(worksheet, moneyKeys);

  return workbook.xlsx.writeBuffer();
};

// ─────────────────────────────────────────────
// 5c – Doanh thu theo nhân viên
// ─────────────────────────────────────────────
export const exportRevenueByStaff = async (data) => {
  const workbook = createWorkbook();
  const worksheet = workbook.addWorksheet("Doanh Thu Theo Nhân Viên", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.columns = [
    { header: "Nhân Viên", key: "staffName", width: 22 },
    { header: "2024 (đ)", key: "year2024", width: 16 },
    { header: "2025 (đ)", key: "year2025", width: 16 },
    { header: "2026 (đ)", key: "year2026", width: 16 },
    { header: "Tổng Cộng (đ)", key: "total", width: 18 },
  ];

  applyHeaderStyle(worksheet.getRow(1));

  const moneyKeys = ["year2024", "year2025", "year2026", "total"];

  data.forEach((item, index) => {
    const y24 = item.years?.[2024] || item.years?.["2024"] || 0;
    const y25 = item.years?.[2025] || item.years?.["2025"] || 0;
    const y26 = item.years?.[2026] || item.years?.["2026"] || 0;
    const total = y24 + y25 + y26;

    const row = worksheet.addRow({
      staffName: item.staffName,
      year2024: y24,
      year2025: y25,
      year2026: y26,
      total,
    });
    applyDataRowStyle(row, index % 2 === 0);
    moneyKeys.forEach((k) => {
      row.getCell(k).numFmt = MONEY_FMT;
      row.getCell(k).alignment = { horizontal: "right" };
    });
    row.getCell("total").font = {
      bold: true,
      size: 11,
      color: { argb: "FF1F2937" },
    };
  });

  const sum24 = data.reduce(
    (s, i) => s + (i.years?.[2024] || i.years?.["2024"] || 0),
    0,
  );
  const sum25 = data.reduce(
    (s, i) => s + (i.years?.[2025] || i.years?.["2025"] || 0),
    0,
  );
  const sum26 = data.reduce(
    (s, i) => s + (i.years?.[2026] || i.years?.["2026"] || 0),
    0,
  );

  const summaryRow = worksheet.addRow({
    staffName: "TỔNG CỘNG",
    year2024: sum24,
    year2025: sum25,
    year2026: sum26,
    total: sum24 + sum25 + sum26,
  });
  applySummaryStyle(summaryRow);
  moneyKeys.forEach((k) => {
    summaryRow.getCell(k).numFmt = MONEY_FMT;
    summaryRow.getCell(k).alignment = { horizontal: "right" };
  });

  // QUAN TRỌNG: finalize SAU khi có dòng tổng → hết ######
  finalizeColumnWidths(worksheet, moneyKeys);

  return workbook.xlsx.writeBuffer();
};

// ─────────────────────────────────────────────
// 5e – Sản phẩm theo quý
// ─────────────────────────────────────────────
export const exportRevenueByProductQuarter = async (data, year) => {
  const workbook = createWorkbook();
  const worksheet = workbook.addWorksheet(`Doanh Thu SP Theo Quý ${year}`, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.columns = [
    { header: "Sản Phẩm", key: "productName", width: 28 },
    { header: "Q1 (đ)", key: "q1", width: 16 },
    { header: "Q2 (đ)", key: "q2", width: 16 },
    { header: "Q3 (đ)", key: "q3", width: 16 },
    { header: "Q4 (đ)", key: "q4", width: 16 },
    { header: "Tổng Cộng (đ)", key: "total", width: 18 },
  ];

  applyHeaderStyle(worksheet.getRow(1));

  const moneyKeys = ["q1", "q2", "q3", "q4", "total"];

  data.forEach((item, index) => {
    const q1 = item.quarters?.Q1 || 0;
    const q2 = item.quarters?.Q2 || 0;
    const q3 = item.quarters?.Q3 || 0;
    const q4 = item.quarters?.Q4 || 0;
    const total = q1 + q2 + q3 + q4;

    const row = worksheet.addRow({
      productName: item.productName,
      q1,
      q2,
      q3,
      q4,
      total,
    });
    applyDataRowStyle(row, index % 2 === 0);
    moneyKeys.forEach((k) => {
      row.getCell(k).numFmt = MONEY_FMT;
      row.getCell(k).alignment = { horizontal: "right" };
    });
    row.getCell("total").font = {
      bold: true,
      size: 11,
      color: { argb: "FF1F2937" },
    };
  });

  const summaryRow = worksheet.addRow({
    productName: "TỔNG CỘNG",
    q1: data.reduce((s, i) => s + (i.quarters?.Q1 || 0), 0),
    q2: data.reduce((s, i) => s + (i.quarters?.Q2 || 0), 0),
    q3: data.reduce((s, i) => s + (i.quarters?.Q3 || 0), 0),
    q4: data.reduce((s, i) => s + (i.quarters?.Q4 || 0), 0),
    total: data.reduce(
      (s, i) =>
        s +
        (i.quarters?.Q1 || 0) +
        (i.quarters?.Q2 || 0) +
        (i.quarters?.Q3 || 0) +
        (i.quarters?.Q4 || 0),
      0,
    ),
  });
  applySummaryStyle(summaryRow);
  moneyKeys.forEach((k) => {
    summaryRow.getCell(k).numFmt = MONEY_FMT;
    summaryRow.getCell(k).alignment = { horizontal: "right" };
  });

  finalizeColumnWidths(worksheet, moneyKeys);

  return workbook.xlsx.writeBuffer();
};

// ─────────────────────────────────────────────
// 5d – Theo khách hàng (năm / quý)
// ─────────────────────────────────────────────
export const exportRevenueByCustomer = async (data, mode, year) => {
  const workbook = createWorkbook();
  const sheetTitle =
    mode === "year"
      ? "Thống Kê Khách Hàng Theo Năm"
      : `Thống Kê Khách Hàng Theo Quý ${year}`;

  const worksheet = workbook.addWorksheet(sheetTitle, {
    views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
  });

  const periods =
    mode === "year" ? ["2024", "2025", "2026"] : ["Q1", "Q2", "Q3", "Q4"];

  worksheet.columns = [
    { header: "Khách Hàng", key: "customer", width: 24 },
    ...periods.map((p) => ({
      header: mode === "year" ? `${p} (đ)` : `${p} (đ)`,
      key: p,
      width: 16,
    })),
    { header: "Tổng Cộng (đ)", key: "total", width: 18 },
  ];

  applyHeaderStyle(worksheet.getRow(1));

  const moneyKeys = [...periods, "total"];

  data.forEach((customer, index) => {
    const rowData = { customer: customer.customerName, total: 0 };
    periods.forEach((period) => {
      const revenue =
        mode === "year"
          ? customer.years?.[period] || customer.years?.[Number(period)] || 0
          : customer.quarters?.[period] || 0;
      rowData[period] = revenue;
      rowData.total += revenue;
    });

    const row = worksheet.addRow(rowData);
    applyDataRowStyle(row, index % 2 === 0);
    moneyKeys.forEach((k) => {
      row.getCell(k).numFmt = MONEY_FMT;
      row.getCell(k).alignment = { horizontal: "right" };
    });
    row.getCell("total").font = {
      bold: true,
      size: 11,
      color: { argb: "FF1F2937" },
    };
  });

  const summaryData = {
    customer: "TỔNG CỘNG",
    total: 0,
  };
  periods.forEach((period) => {
    summaryData[period] = data.reduce((sum, c) => {
      return (
        sum +
        (mode === "year"
          ? c.years?.[period] || c.years?.[Number(period)] || 0
          : c.quarters?.[period] || 0)
      );
    }, 0);
    summaryData.total += summaryData[period];
  });

  const summaryRow = worksheet.addRow(summaryData);
  applySummaryStyle(summaryRow);
  moneyKeys.forEach((k) => {
    summaryRow.getCell(k).numFmt = MONEY_FMT;
    summaryRow.getCell(k).alignment = { horizontal: "right" };
  });

  finalizeColumnWidths(worksheet, moneyKeys);

  return workbook.xlsx.writeBuffer();
};

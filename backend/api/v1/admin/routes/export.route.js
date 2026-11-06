import express from "express";
import * as controller from "../controllers/export.controller.js";

const router = express.Router();

// Xuất thống kê dashboard
router.post(
  "/dashboard/revenue-by-period",
  controller.exportDashboardRevenueByPeriod,
);

router.post(
  "/dashboard/revenue-by-staff",
  controller.exportDashboardRevenueByStaff,
);

router.post(
  "/dashboard/revenue-by-customer",
  controller.exportDashboardRevenueByCustomer,
);

router.post(
  "/dashboard/revenue-by-product-quarter",
  controller.exportDashboardRevenueByProductQuarter,
);

export default router;

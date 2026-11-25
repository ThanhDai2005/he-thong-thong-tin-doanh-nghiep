import express from "express";
const router = express.Router();

import * as controller from "../controllers/statistic.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("statistics_view"), controller.statistic);

router.get(
  "/products",
  requirePermission("statistics_view"),
  controller.products,
);

router.get(
  "/customer-report",
  requirePermission("statistics_view"),
  controller.report,
);

export default router;

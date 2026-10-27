import express from "express";
const router = express.Router();

import * as controller from "../controllers/customerVoucher.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("customer_vouchers_view"), controller.list);

router.post(
  "/",
  requirePermission("customer_vouchers_create"),
  controller.create,
);

router.post(
  "/issue/:promotionId",
  requirePermission("customer_vouchers_create"),
  controller.issueVoucher,
);

router.get(
  "/:promotionId",
  requirePermission("customer_vouchers_view"),
  controller.detail,
);

export default router;

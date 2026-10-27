import express from "express";
const router = express.Router();

import * as controller from "../controllers/stockReceipt.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("stock_receipts_view"), controller.list);

router.get(
  "/:receiptId",
  requirePermission("stock_receipts_view"),
  controller.detail,
);

router.post("/", requirePermission("stock_receipts_create"), controller.create);

router.patch(
  "/confirm/:receiptId",
  requirePermission("stock_receipts_edit"),
  controller.confirm,
);

router.patch(
  "/cancel/:receiptId",
  requirePermission("stock_receipts_edit"),
  controller.cancel,
);

export default router;

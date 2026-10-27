import express from "express";
const router = express.Router();

import * as controller from "../controllers/supplier.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("suppliers_view"), controller.list);

router.get(
  "/:supplierId",
  requirePermission("suppliers_view"),
  controller.detail,
);

router.post("/", requirePermission("suppliers_create"), controller.create);

router.patch(
  "/update/:supplierId",
  requirePermission("suppliers_edit"),
  controller.update,
);

router.patch(
  "/change-status/:status/:supplierId",
  requirePermission("suppliers_edit"),
  controller.changeStatus,
);

router.patch(
  "/change-multi",
  requirePermission("suppliers_edit"),
  controller.changeMulti,
);

router.patch("/delete/:supplierId", controller.deleteItem);

export default router;

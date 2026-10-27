import express from "express";
const router = express.Router();

import * as controller from "../controllers/staff.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("staffs_view"), controller.list);

router.get("/:staffId", requirePermission("staffs_view"), controller.detail);

router.post("/", requirePermission("staffs_create"), controller.create);

router.patch(
  "/update/:staffId",
  requirePermission("staffs_edit"),
  controller.update,
);

router.patch(
  "/change-status/:staffId",
  requirePermission("staffs_edit"),
  controller.changeStatus,
);

router.patch(
  "/change-multi",
  requirePermission("staffs_edit"),
  controller.changeMulti,
);

router.patch(
  "/delete/:staffId",
  requirePermission("staffs_delete"),
  controller.deleteItem,
);

export default router;

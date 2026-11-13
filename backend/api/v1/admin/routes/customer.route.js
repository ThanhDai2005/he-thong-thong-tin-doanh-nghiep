import express from "express";
const router = express.Router();

import * as controller from "../controllers/customer.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("customers_view"), controller.list);

router.get(
  "/:customerId",
  requirePermission("customers_view"),
  controller.detail,
);

router.post("/", requirePermission("customers_create"), controller.create);

router.patch(
  "/update/:customerId",
  requirePermission("customers_edit"),
  controller.update,
);

router.patch(
  "/change-status/:customerId",
  requirePermission("customers_edit"),
  controller.changeStatus,
);

router.patch(
  "/change-multi",
  requirePermission("customers_edit"),
  controller.changeMulti,
);

router.patch(
  "/delete/:customerId",
  requirePermission("customers_delete"),
  controller.deleteItem,
);

export default router;

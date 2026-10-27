import express from "express";
const router = express.Router();

import * as controller from "../controllers/orderPromotion.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("order_promotions_view"), controller.list);

router.get(
  "/:orderPromotionId",
  requirePermission("order_promotions_view"),
  controller.detail,
);

router.post("/", requirePermission("order_promotions_create"), controller.create);

router.patch(
  "/update/:orderPromotionId",
  requirePermission("order_promotions_edit"),
  controller.update,
);

router.patch(
  "/change-status/:orderPromotionId",
  requirePermission("order_promotions_edit"),
  controller.changeStatus,
);

router.patch(
  "/change-multi",
  requirePermission("order_promotions_edit"),
  controller.changeMulti,
);

router.patch(
  "/delete/:orderPromotionId",
  requirePermission("order_promotions_delete"),
  controller.deleteItem,
);

export default router;

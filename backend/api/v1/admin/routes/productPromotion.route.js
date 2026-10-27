import express from "express";
const router = express.Router();

import * as controller from "../controllers/productPromotion.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("product_promotions_view"), controller.list);

router.get(
  "/:productPromotionId",
  requirePermission("product_promotions_view"),
  controller.detail,
);

router.post("/", requirePermission("product_promotions_create"), controller.create);

router.patch(
  "/update/:productPromotionId",
  requirePermission("product_promotions_edit"),
  controller.update,
);

router.patch(
  "/change-status/:productPromotionId",
  requirePermission("product_promotions_edit"),
  controller.changeStatus,
);

router.patch(
  "/change-multi",
  requirePermission("product_promotions_edit"),
  controller.changeMulti,
);

router.patch(
  "/delete/:productPromotionId",
  requirePermission("product_promotions_delete"),
  controller.deleteItem,
);

export default router;

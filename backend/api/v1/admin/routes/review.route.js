import express from "express";
const router = express.Router();

import * as controller from "../controllers/review.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/stats", requirePermission("reviews_view"), controller.stats);

router.get("/", requirePermission("reviews_view"), controller.list);
router.get(
  "/detail/:reviewId",
  requirePermission("reviews_view"),
  controller.detail,
);

router.patch(
  "/reply/:reviewId",
  requirePermission("reviews_edit"),
  controller.reply,
);
router.patch(
  "/delete-reply/:reviewId",
  requirePermission("reviews_edit"),
  controller.deleteReply,
);

router.patch(
  "/toggle-hidden/:reviewId",
  requirePermission("reviews_edit"),
  controller.toggleHidden,
);

export default router;

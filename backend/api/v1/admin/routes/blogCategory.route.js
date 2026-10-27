import express from "express";
const router = express.Router();

import * as controller from "../controllers/blogCategory.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("blog_categories_view"), controller.list);

router.get(
  "/:blogCategoryId",
  requirePermission("blog_categories_view"),
  controller.detail,
);

router.post(
  "/",
  requirePermission("blog_categories_create"),
  controller.create,
);

router.patch(
  "/update/:blogCategoryId",
  requirePermission("blog_categories_edit"),
  controller.update,
);

router.patch(
  "/change-status/:status/:blogCategoryId",
  requirePermission("blog_categories_edit"),
  controller.changeStatus,
);

router.patch(
  "/change-multi",
  requirePermission("blog_categories_delete"),
  controller.changeMulti,
);

router.patch(
  "/delete/:blogCategoryId",
  requirePermission("blog_categories_delete"),
  controller.deleteItem,
);

export default router;

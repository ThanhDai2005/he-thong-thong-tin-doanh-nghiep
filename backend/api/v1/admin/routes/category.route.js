import express from "express";
const router = express.Router();

import * as controller from "../controllers/category.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("categories_view"), controller.list);

router.get("/:categoryId", requirePermission("categories_view"), controller.detail);

router.post("/", requirePermission("categories_create"), controller.create);

router.patch("/update/:categoryId", requirePermission("categories_edit"), controller.update);

router.patch(
  "/change-status/:status/:categoryId",
  requirePermission("categories_edit"),
  controller.changeStatus,
);

router.patch(
  "/change-multi",
  requirePermission("categories_edit"),
  controller.changeMulti,
);

router.patch(
  "/delete/:categoryId",
  requirePermission("categories_delete"),
  controller.deleteItem,
);

export default router;

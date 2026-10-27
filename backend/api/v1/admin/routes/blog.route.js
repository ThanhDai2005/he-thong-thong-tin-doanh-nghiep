import express from "express";
const router = express.Router();
import multer from "multer";
import { uploadSingle } from "../middlewares/uploadCloud.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
});

import * as controller from "../controllers/blog.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("blogs_view"), controller.list);

router.get("/:blogId", requirePermission("blogs_view"), controller.detail);

router.post(
  "/",
  requirePermission("blogs_create"),
  upload.single("imageUrl"),
  uploadSingle,
  controller.create,
);

router.patch(
  "/update/:blogId",
  requirePermission("blogs_edit"),
  upload.single("imageUrl"),
  uploadSingle,
  controller.update,
);

router.patch(
  "/change-status/:status/:blogId",
  requirePermission("blogs_edit"),
  controller.changeStatus,
);

router.patch(
  "/change-multi",
  requirePermission("blogs_delete"),
  controller.changeMulti,
);

router.patch(
  "/delete/:blogId",
  requirePermission("blogs_delete"),
  controller.deleteItem,
);

export default router;

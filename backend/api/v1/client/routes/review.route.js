import express from "express";
const router = express.Router();
import multer from "multer";
import { uploadMulti } from "../middlewares/uploadCloud.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
});

import { requireAuth } from "../middlewares/auth.middleware.js";
import * as controller from "../controllers/review.controller.js";

router.get("/:productId", controller.listByProduct);

router.post(
  "/",
  requireAuth,
  upload.array("images", 5),
  uploadMulti,
  controller.create,
);

export default router;

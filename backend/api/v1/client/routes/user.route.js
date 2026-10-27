import express from "express";
const router = express.Router();
import multer from "multer";
import { uploadSingle } from "../middlewares/uploadCloud.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
});

import * as controller from "../controllers/user.controller.js";

router.get("/detail", controller.getDetail);

router.patch(
  "/uploadAvatar",
  upload.single("avatar"),
  uploadSingle,
  controller.uploadAvatar,
);

router.patch("/profile", controller.updateInfo);

router.patch("/change-password", controller.changePassword);

export default router;

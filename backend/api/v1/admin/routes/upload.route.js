import express from "express";
const router = express.Router();
import multer from "multer";
import { uploadSingle } from "../middlewares/uploadCloud.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
});

import * as controller from "../controllers/upload.controller.js";

router.post("/", upload.single("file"), uploadSingle, controller.upload);

export default router;

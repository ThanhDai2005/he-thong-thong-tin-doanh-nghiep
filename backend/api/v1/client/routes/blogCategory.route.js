import express from "express";
const router = express.Router();

import * as controller from "../controllers/blogCategory.controller.js";

router.get("/", controller.list);

export default router;

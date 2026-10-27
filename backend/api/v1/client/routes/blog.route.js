import express from "express";
const router = express.Router();

import * as controller from "../controllers/blog.controller.js";

router.get("/", controller.list);

router.get("/:slug", controller.detail);

export default router;

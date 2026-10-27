import express from "express";
const router = express.Router();

import * as controller from "../controllers/category.controller.js";

router.get("/", controller.list);

export default router;

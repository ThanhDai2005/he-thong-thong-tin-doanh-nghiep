import express from "express";
const router = express.Router();

import * as controller from "../controllers/dashboard.controller.js";

router.get("/", controller.dashboard);

export default router;

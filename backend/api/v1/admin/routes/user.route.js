import express from "express";
const router = express.Router();

import * as controller from "../controllers/user.controller.js";

router.get("/detail", controller.getDetail);

export default router;

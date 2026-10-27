import express from "express";
const router = express.Router();

import * as controller from "../controllers/auth.controller.js";
import { loginLimiter } from "../../../../middlewares/rateLimiter.middleware.js";

router.post("/login", loginLimiter, controller.login);

router.post("/logout", controller.logout);

router.post("/refresh", controller.refreshToken);

export default router;

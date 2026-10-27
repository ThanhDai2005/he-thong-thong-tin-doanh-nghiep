import express from "express";
const router = express.Router();

import * as controller from "../controllers/auth.controller.js";
import {
  loginLimiter,
  forgotPasswordLimiter,
} from "../../../../middlewares/rateLimiter.middleware.js";

router.post("/signup", loginLimiter, controller.signUp);

router.post("/signin", loginLimiter, controller.signIn);

router.post("/signout", controller.signOut);

router.post("/refresh", controller.refreshToken);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  controller.forgotPassword,
);

router.post("/verify-otp", forgotPasswordLimiter, controller.verifyOtp);

router.post("/reset-password", forgotPasswordLimiter, controller.resetPassword);

router.post("/google", loginLimiter, controller.googleAuth);

export default router;

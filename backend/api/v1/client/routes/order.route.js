import express from "express";
const router = express.Router();

import * as controller from "../controllers/order.controller.js";
import {
  orderCreationLimiter,
  cancelOrderLimiter,
  retryPaymentLimiter,
} from "../../../../middlewares/rateLimiter.middleware.js";

router.post("/", orderCreationLimiter, controller.create);
router.post("/momo-callback", controller.momoCallback);
router.get("/vnpay-ipn", controller.vnpayIpn);

router.post(
  "/:orderId/retry-payment",
  retryPaymentLimiter,
  controller.retryPayment,
);

router.get("/my", controller.myOrders);
router.get("/detail/:orderId", controller.detail);
router.get("/:orderId/reviews", controller.getOrderReviews);
router.patch("/cancel/:orderId", cancelOrderLimiter, controller.cancelOrder);

export default router;

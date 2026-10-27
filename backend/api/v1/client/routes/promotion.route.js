import express from "express";
const router = express.Router();

import * as controller from "../controllers/promotion.controller.js";

router.get("/collectible", controller.getCollectibleVouchers);

router.post("/collect/:promotionId", controller.collectVoucher);

router.get("/available", controller.getAvailablePromotions);

router.post("/calculate", controller.calculateDiscount);

export default router;

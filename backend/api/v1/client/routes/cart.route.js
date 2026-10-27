import express from "express";
const router = express.Router();

import * as controller from "../controllers/cart.controller.js";

router.get("/", controller.getCart);

router.post("/add", controller.addToCart);

router.patch("/update/:productId", controller.updateQuantity);

router.patch("/remove/:productId", controller.removeFromCart);

router.post("/clear", controller.clearCart);

export default router;
